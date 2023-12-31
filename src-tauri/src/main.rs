// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::{Write, Read}, path::Path, process::{Command, Stdio}, sync::{Arc, Mutex, atomic::{AtomicU64, Ordering}}, net::UdpSocket, thread, time::{SystemTime, UNIX_EPOCH}, env};
use tauri::State;
use rand::Rng;
use gstreamer as gst;
use gstreamer_app as gst_app;
use gstreamer::prelude::*;

static TIMESTAMP_COUNTER: AtomicU64 = AtomicU64::new(0);
const BUFFER_DURATION_MS: u64 = 33;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct AppSharedState {
    video_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    klv_appsrc: Arc<Mutex<gst_app::AppSrc>>,
}

#[allow(dead_code)]
fn save_image_to_disk(data: Vec<u8>){
    let user = std::env::var("USERNAME").unwrap_or("/".into());
    let path_string = format!("/home/{user}/app/image.jpg");
    let mut file = File::create(Path::new(&path_string)).expect("Failed to create file");
    file.write_all(&data).expect("Failed to write to disk");
}

#[allow(dead_code)]
fn timestamp_buffer(buffer: &mut gst::Buffer, data: &Vec<u8>){
    let buffer = buffer.get_mut().unwrap();
    let _ = buffer.copy_from_slice(0, data);

    let now = SystemTime::now().duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    // let now = TIMESTAMP_COUNTER.fetch_add(BUFFER_DURATION_MS, Ordering::SeqCst);
    let pts = gst::ClockTime::from_mseconds(now.as_millis() as u64);
    // let pts = gst::ClockTime::from_mseconds(now);
    buffer.set_pts(pts);
    buffer.set_dts(pts + gst::ClockTime::from_mseconds(BUFFER_DURATION_MS));
    // buffer.set_dts(pts);
    buffer.set_duration(gst::ClockTime::from_mseconds(BUFFER_DURATION_MS));
}

#[tauri::command]
fn send_packet(state: State<AppSharedState>, image_arr: Vec<u8>) {

    let klv = generate_fake_klv_data(32);

    let video_appsrc = state.video_appsrc.lock().unwrap();
    let klv_appsrc = state.klv_appsrc.lock().unwrap();
    
    let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create image gst buffer");
    timestamp_buffer(&mut image_buf, &image_arr);

    let mut klv_buf = gst::Buffer::with_size(klv.len()).expect("Failed to create klv gst buffer");
    timestamp_buffer(&mut klv_buf, &klv);
    
    // println!("{:?}", &image_buf);
    // println!("{:?}", &klv_buf);

    // assert!(klv_buf.size() == klv.len(), "Buffer size is not correct");
    // if let Ok(map) = klv_buf.map_readable() {
    //     println!("KLV BUFFER CONTENTS (first 10 bytes): {:?}", &map.as_slice()[..10.min(map.size())]);
    // }

    video_appsrc.push_buffer(image_buf).expect("Failed to push to image buffer");
    klv_appsrc.push_buffer(klv_buf).expect("Failed to push to klv buffer");
}

fn main() {

    env::set_var("RUST_BACKTRACE", "1");
    env::set_var("GST_DEBUG", "5");

    // SETUP
    // Initialize GStreamer
    gst::init().expect("Failed to init gstreamer");

    // Create the elements
    // APP SRC SETUP
    let video_appsrc = gst::ElementFactory::make("appsrc")
        .build()
        .expect("Could not create video_appsrc element.")
        .dynamic_cast::<gst_app::AppSrc>()
        .expect("Failed to cast to Video AppSrc");
    let klv_appsrc = gst::ElementFactory::make("appsrc")
        .build()
        .expect("Could not create klv_appsrc element.")
        .dynamic_cast::<gst_app::AppSrc>()
        .expect("Failed to cast to KLV AppSrc");

    // Set caps for the KLV appsrc element
    let video_caps = gst::caps::Caps::builder("image/jpeg")
        .field("width", &1280)
        .field("height", &720)
        .field("framerate", &gst::Fraction::new(20, 1))
        .build();
    video_appsrc.set_caps(Some(&video_caps));

    let klv_caps = gst::Caps::new_simple(
        "meta/x-klv",
        &[
            ("parsed", &true),
        ],
    );

    // video_appsrc.set_max_bytes(500_000_000);
    let vid_appsrc_prop = video_appsrc.max_bytes();
    println!("APPSRC PROP: {:?}", vid_appsrc_prop);

    let videotestsrc = gst::ElementFactory::make("videotestsrc").build().expect("failed to build videotestsrc");
    videotestsrc.set_property_from_str("pattern", "smpte");

    let jpegparse = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse");
    let jpegdec = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec");
    let videoconvert = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert");
    let x264enc = gst::ElementFactory::make("x264enc").build().expect("failed to build x264enc");
    let video_queue = gst::ElementFactory::make("queue").build().expect("failed to build videoqueue");
    let klv_queue = gst::ElementFactory::make("queue").build().expect("failed to build klvqueue");
    let mpegtsmux = gst::ElementFactory::make("mpegtsmux").build().expect("failed to build mpegtsmux");
    let udpsink = gst::ElementFactory::make("udpsink").build().expect("failed to build udpsink");
    let fakesink = gst::ElementFactory::make("fakesink").build().expect("failed to build fakesink");

    udpsink.set_property_from_str("host", "239.0.0.1");
    udpsink.set_property_from_str("port", "8001");

    fakesink.set_property_from_str("sync", "false");
    fakesink.set_property_from_str("dump", "true");

    let fdsink = gst::ElementFactory::make("fdsink").build().expect("Failed to build fdsink");
    fdsink.set_property("fd", 1);

    let pipeline = gst::Pipeline::new();
    pipeline.add_many(&[
        // &videotestsrc,
        &video_appsrc.upcast_ref(),
        &jpegparse,
        &jpegdec,
        &videoconvert,
        &x264enc,
        // &video_queue,
        // &klv_queue,
        &klv_appsrc.upcast_ref(),
        &mpegtsmux,
        &udpsink,
        // &fakesink,
        // &fdsink,
    ])
    .expect("failed to add to pipeline");
    
    gst::Element::link_many(&[
        // &videotestsrc,
        &video_appsrc.upcast_ref(),
        &jpegparse,
        &jpegdec,
        &videoconvert,
        &x264enc,
        // &video_queue,
        &mpegtsmux,
        // &fdsink,
        // &fakesink,
    ])
    .expect("failed to link_many");
    
    // klv_appsrc.link(&klv_queue).expect("Failed to link klv_appsrc to klv_queue element");
    // klv_queue.link_filtered(&mpegtsmux, &klv_caps).expect("Failed to link klv_queue to mpegtsmux element");
    klv_appsrc.link_filtered(&mpegtsmux, &klv_caps).expect("Failed to link klvsrc to mpegtsmux element"); // without queue in between
    mpegtsmux.link(&udpsink).expect("Failed to link mpegtsmux to udpsink");

    // Create start time segment - tells gstreamer that we're starting at 0
    let mut formatted_segment = gst::Segment::new();
    formatted_segment.set_format(gst::Format::Time);
    formatted_segment.set_start(gst::ClockTime::from_seconds(0)); // start playing from this time
    formatted_segment.set_time(gst::ClockTime::from_seconds(0)); // set the current time

    let segment = gst::event::Segment::new(&formatted_segment);

    let segment_event = gst::Event::from(segment);
    // pipeline.send_event(segment_event);

    // Start pipeline
    pipeline.set_state(gst::State::Playing).expect("Failed to set pipeline to playing");

    // let gst_pipeline = "udpsrc address=239.0.0.2 port=8002 ! jpegdec ! x264enc ! queue ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 udpsrc address=239.0.0.3 port=8003 ! queue ! mux";
    // let gst_pipeline = "udpsrc address=239.0.0.2 port=8002 caps=\"image/jpeg\" ! jpegparse ! jpegdec ! videoconvert ! udpsink address=239.0.0.1 port=8001";
    // let gst_pipeline = "filesrc location=/tmp/pipe1 ! jpegparse ! jpegdec ! videoconvert ! x264enc ! mpegtsmux ! udpsink host=239.0.0.1 port=8001";
    let gst_pipeline = "filesrc location=/tmp/pipe1 ! jpegparse ! jpegdec ! videoconvert ! x264enc ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 filesrc location=/tmp/pipe2 ! mux.";
    // let gst_pipeline = "filesrc location=/tmp/pipe1 ! fdsink fd=1"; // printing to stdout for testing


    // let gst = Command::new("gst-launch-1.0")
    //     .args(gst_pipeline.split(" "))
    //     // .args("udpsrc address=239.0.0.2 port=8002 ! jpegdec ! x264enc ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 udpsrc address=239.0.0.3 port=8003 ! mux".split(" "))
    //     .stdin(Stdio::piped())
    //     .spawn()
    //     .expect("Failed to start gstreamer command");
    // let video_stdin = Mutex::new(gst.stdin);

    // let ffmpeg_video = "-loglevel quiet -f image2pipe -c:v mjpeg -i - -f mpegts udp://239.0.0.2:8888";
    
    // let ffmpeg_output = "-thread_queue_size 512 -i udp://239.0.0.2:8888 -thread_queue_size 512 -f data -i udp://239.0.0.3:8889 -map 0 -map 1 -c copy -f mpegts udp://239.0.0.1:8000";
    // let ffmpeg_output = "-thread_queue_size 10000 -i udp://239.0.0.2:8888 -thread_queue_size 10000 -f data -i - -map 0 -map 1 -c copy -f mpegts udp://239.0.0.1:8000";
    // let ffmpeg_output = "-thread_queue_size 10000 -i udp://239.0.0.2:8888 -map 0 -c copy -f mpegsts udp://239.0.0.1:8000";
    // let ffmpeg_output = "-loglevel quiet -c:v mjpeg -i /tmp/pipe1 -f data -i /tmp/pipe2 -map 0 -map 1 -c copy -f mpegts udp://239.0.0.1:8000";
    // let ffmpeg_output = "-thread_queue_size 512 -f image2pipe -c:v mjpeg -i /tmp/pipe1 -map 0 -f mpegts udp://239.0.0.1:8000";

    // let video_handler = Command::new("ffmpeg")
    //     .args(ffmpeg_video.split(" "))
    //     .stdin(Stdio::piped())
    //     .spawn()
    //     .expect("Failed to start ffmpeg video handler");

    // let video_stdin = Mutex::new(video_handler.stdin);

    // TODO: create a handler that the front end can call to start the ffmpeg script.
    // println!("CREATING PIPES");
    // let pipe1 = File::create("/tmp/pipe1").expect("Failed to create pipe1 file handle");
    // let pipe2 = File::create("/tmp/pipe2").expect("Failed to create pipe2 file handle");
    // println!("PIPES CREATED");


    // Master Output Stream 
    // let output_handler = Command::new("ffmpeg")
    //     .args(ffmpeg_output.split(" "))
    //     .stdin(Stdio::piped())
    //     .spawn()
    //     .expect("Failed to start ffmpeg master output");
    // let output_stdin = Mutex::new(output_handler.stdin);


    let shared_state = AppSharedState{
        video_appsrc: Arc::new(Mutex::new(video_appsrc)),
        klv_appsrc: Arc::new(Mutex::new(klv_appsrc)),
    };

    tauri::Builder::default()
        .manage(shared_state)
        .invoke_handler(tauri::generate_handler![
            send_packet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


fn generate_fake_klv_data(value_length: usize) -> Vec<u8> {
    let mut rng = rand::thread_rng();

    // Generate a fixed 16-byte key (UUID)
    let key: [u8; 16] = [
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F,
    ];

    // Generate a random value of the specified length
    let value: Vec<u8> = (0..value_length).map(|_| rng.gen()).collect();

    // Length field
    let length: Vec<u8> = vec![value_length as u8];

    // Combine key, length, and value into a single Vec<u8>
    [key.to_vec(), length, value].concat()
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write, path::Path, process::{Command, Stdio}, sync::{Arc, Mutex}, net::UdpSocket, thread};
use tauri::State;
use rand::Rng;
use gstreamer::prelude::*;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct AppSharedState {
    // video_stdin: Mutex<Option<std::process::ChildStdin>>,
    // output_stdin: Mutex<Option<std::process::ChildStdin>>,
    // klv_stdin: Mutex<Option<std::process::ChildStdin>>,
    // klv_socket: UdpSocket,
    // klv_target: String,

    // ffmpeg_script: String,

    mjpeg_socket: Arc<Mutex<UdpSocket>>,
    mjpeg_target: String,
    klv_socket: Arc<Mutex<UdpSocket>>,
    klv_target: String,

    // pipe1: File, 
    // pipe2: File, 
    // data_stdin: Mutex<Option<std::process::ChildStdin>>,
    // video_socket: UdpSocket,
    // video_target: String,
}

#[allow(dead_code)]
fn save_image_to_disk(data: Vec<u8>){
    let user = std::env::var("USERNAME").unwrap_or("/".into());
    let path_string = format!("/home/{user}/app/image.jpg");
    let mut file = File::create(Path::new(&path_string)).expect("Failed to create file");
    file.write_all(&data).expect("Failed to write to disk");
}


#[tauri::command]
fn send_packet(state: State<AppSharedState>, image_arr: Vec<u8>) {

    let klv = generate_fake_klv_data(32);
    let mjpeg_socket = state.mjpeg_socket.lock().unwrap();
    let klv_socket = state.klv_socket.lock().unwrap();
    // println!("{:?}", klv);
    mjpeg_socket.send_to(&image_arr, &state.mjpeg_target);
    klv_socket.send_to(&klv, &state.klv_target);
    
}

fn main() {

    // SETUP

    // UDP Sources
    let mjpeg_socket = UdpSocket::bind("0.0.0.0:0").expect("failed to bind mjpeg_socket");
    let mjpeg_target = "239.0.0.2:8002".to_string();
    let klv_socket = UdpSocket::bind("0.0.0.0:0").expect("failed to bind klv_socket");
    let klv_target = "239.0.0.3:8003".to_string();

    // gstreamer::init().unwrap();

    // let pipeline = gstreamer::Pipeline::new();

    // let udpsrc_mjpeg = gstreamer::ElementFactory::make("udpsrc").build().expect("Failed to build 'udpsrc_mjpeg'");
    // udpsrc_mjpeg.set_property("address" , "239.0.0.2");
    // udpsrc_mjpeg.set_property("port", 8002);

    // let jpegdec = gstreamer::ElementFactory::make("jpegdec").build().expect("Failed to build 'jpegdec'");
    // let x264enc = gstreamer::ElementFactory::make("x264enc").build().expect("Failed to build 'x264enc'");
    // let mpegtsmux = gstreamer::ElementFactory::make("mpegtsmux").build().expect("Failed to build 'mpegtsmux'");

    // let udpsink = gstreamer::ElementFactory::make("udpsink").build().expect("Failed to build 'udpsink'");
    // udpsink.set_property("host", "239.0.0.1");
    // udpsink.set_property("port", 8001);

    // let udpsrc_klv = gstreamer::ElementFactory::make("udpsrc").build().expect("Failed to build 'udpsrc_klv'");
    // udpsrc_klv.set_property("address", "239.0.0.3");
    // udpsrc_klv.set_property("port", 8003);
    
    // let sequence = [
    //     &udpsrc_mjpeg,
    //     &jpegdec,
    //     &x264enc,
    //     &mpegtsmux,
    //     &udpsink,
    //     &udpsrc_klv
    // ];
    
    // pipeline.add_many(&sequence).expect("Failed to add elements to pipeline");

    // gstreamer::Element::link_many(&sequence);
    // udpsrc_klv.link_pads(None, &mpegtsmux, Some("sink_%u")).expect("Failed to link udpsrc_klv pads");

    // pipeline.set_state(gstreamer::State::Playing).expect("Failed to start gstreamer pipeline");

    // let bus = pipeline.bus().unwrap();

    let gst = Command::new("gst-launch-1.0")
        .args(&["udpsrc", "address=239.0.0.2", "port=8002", "!", "jpegdec", "!", "x264enc", "!", "mpegtsmux", "name=mux", "!", "udpsink", "host=239.0.0.1", "port=8001", "udpsrc", "address=239.0.0.3", "port=8003", "!", "mux."])
        // .args("udpsrc address=239.0.0.2 port=8002 ! jpegdec ! x264enc ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 udpsrc address=239.0.0.3 port=8003 ! mux".split(" "))
        .spawn()
        .expect("Failed to start gstreamer command");

    // let ffmpeg_video = "-loglevel quiet -f image2pipe -c:v mjpeg -i - -f mpegts udp://239.0.0.2:8888";
    
    // let ffmpeg_output = "-thread_queue_size 512 -i udp://239.0.0.2:8888 -thread_queue_size 512 -f data -i udp://239.0.0.3:8889 -map 0 -map 1 -c copy -f mpegts udp://239.0.0.1:8000";
    // let ffmpeg_output = "-thread_queue_size 10000 -i udp://239.0.0.2:8888 -thread_queue_size 10000 -f data -i - -map 0 -map 1 -c copy -f mpegts udp://239.0.0.1:8000";
    // let ffmpeg_output = "-thread_queue_size 10000 -i udp://239.0.0.2:8888 -map 0 -c copy -f mpegts udp://239.0.0.1:8000";
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
        mjpeg_socket: Arc::new(Mutex::new(mjpeg_socket)),
        mjpeg_target,
        klv_socket: Arc::new(Mutex::new(klv_socket)),
        klv_target,
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
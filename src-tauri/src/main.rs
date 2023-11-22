// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::{Write, Read}, path::Path, process::{Command, Stdio}, sync::{Arc, Mutex}, net::UdpSocket, thread};
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
    pipe1: Mutex<File>, 
    pipe2: Mutex<File>, 
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

    let mut pipe1 = state.pipe1.lock().unwrap();
    let mut pipe2 = state.pipe2.lock().unwrap();

    pipe1.write_all(&image_arr).expect("Failed to write to video pipe");
    pipe2.write_all(&klv).expect("Failed to write to klv pipe");


    // let mut video_stdin = state.video_stdin.lock().unwrap();
    // if let Some(stdin) = video_stdin.as_mut(){
    //     let res = stdin.write_all(&image_arr);
    //     match(res) {
    //         Err(e) => println!("{:?}", e),
    //         _ => {}
    //     }
    // }

    // thread::sleep(std::time::Duration::from_millis(10)); // this appears to be needed to allow some time before sending data

    // let mjpeg_socket = state.mjpeg_socket.lock().unwrap();
    // let klv_socket = state.klv_socket.lock().unwrap();
    // klv_socket.send_to(&klv, &state.klv_target);
    // mjpeg_socket.send_to(&image_arr, &state.mjpeg_target);
    
}

fn main() {

    // SETUP
    // make pipe1 fifo
    let _ = Command::new("mkfifo")
        .arg("/tmp/pipe1")
        .status()
        .expect("Failed to mkfifo for pipe1");
    let _ = Command::new("mkfifo")
        .arg("/tmp/pipe2")
        .status()
        .expect("Failed to mkfifo for pipe1");

    // create file reader so there is something listening to this fifo
    thread::spawn(move || {
        let mut pipe = File::open("/tmp/pipe1").expect("Failed to open pipe1");
        let mut buffer = [0;10];
        match pipe.read(&mut buffer) {
            Ok(_) => println!("Received data from pipe1"),
            Err(e) => eprintln!("Error reading FIFO: {}", e),
        }
    });
    thread::spawn(move || {
        let mut pipe = File::open("/tmp/pipe2").expect("Failed to open pipe1");
        let mut buffer = [0;10];
        match pipe.read(&mut buffer) {
            Ok(_) => println!("Received data from pipe2"),
            Err(e) => eprintln!("Error reading FIFO: {}", e),
        }
    });

    let mut pipe1 = File::create("/tmp/pipe1").expect("failed to create handler for pipe1");
    pipe1.write_all(b"test").expect("Failed to write test message to pipe1");
    let mut pipe2 = File::create("/tmp/pipe2").expect("failed to create handler for pipe1");
    pipe2.write_all(b"test").expect("Failed to write test message to pipe1");
    println!("MADE IT PAST PIPE1");

    // let gst_pipeline = "udpsrc address=239.0.0.2 port=8002 ! jpegdec ! x264enc ! queue ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 udpsrc address=239.0.0.3 port=8003 ! queue ! mux";
    // let gst_pipeline = "udpsrc address=239.0.0.2 port=8002 caps=\"image/jpeg\" ! jpegparse ! jpegdec ! videoconvert ! udpsink address=239.0.0.1 port=8001";
    // let gst_pipeline = "filesrc location=/tmp/pipe1 ! jpegparse ! jpegdec ! videoconvert ! x264enc ! mpegtsmux ! udpsink host=239.0.0.1 port=8001";
    let gst_pipeline = "filesrc location=/tmp/pipe1 ! jpegparse ! jpegdec ! videoconvert ! x264enc ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 filesrc location=/tmp/pipe2 ! mux";
    // let gst_pipeline = "filesrc location=/tmp/pipe1 ! fdsink fd=1"; // printing to stdout for testing


    let gst = Command::new("gst-launch-1.0")
        .args(gst_pipeline.split(" "))
        // .args("udpsrc address=239.0.0.2 port=8002 ! jpegdec ! x264enc ! mpegtsmux name=mux ! udpsink host=239.0.0.1 port=8001 udpsrc address=239.0.0.3 port=8003 ! mux".split(" "))
        .stdin(Stdio::piped())
        .spawn()
        .expect("Failed to start gstreamer command");
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
        pipe1: Mutex::new(pipe1),
        pipe2: Mutex::new(pipe2),
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
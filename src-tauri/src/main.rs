// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write, path::Path, process::{Command, Stdio}, sync::Mutex, net::UdpSocket};
use tauri::State;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct AppSharedState {
    video_stdin: Mutex<Option<std::process::ChildStdin>>,
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
    let mut video_stdin = state.video_stdin.lock().unwrap();
    if let Some(stdin) = video_stdin.as_mut() {
        stdin.write_all(&image_arr).expect("Failed to write to video stdin")
    }
}

fn main() {

    let ffmpeg_video = "-f image2pipe -c:v mjpeg -i - -f mpegts udp://239.0.0.2:8888";
    let ffmpeg_output = "-i udp://239.0.0.2:8888 -c copy -f mpegts udp://239.0.0.1:8000";

    let video_handler = Command::new("ffmpeg")
        .args(ffmpeg_video.split(" "))
        .stdin(Stdio::piped())
        .spawn()
        .expect("Failed to start ffmpeg video handler");

    let video_stdin = Mutex::new(video_handler.stdin);


    // Master Output Stream 
    let _ = Command::new("ffmpeg")
        .args(ffmpeg_output.split(" "))
        .spawn()
        .expect("Failed to start ffmpeg master output");


    let shared_state = AppSharedState{video_stdin};

    tauri::Builder::default()
        .manage(shared_state)
        .invoke_handler(tauri::generate_handler![
            send_packet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

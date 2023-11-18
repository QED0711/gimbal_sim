// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write, path::Path, process::{Command, Stdio}, sync::Mutex, net::UdpSocket};
use tauri::State;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct AppSharedState {
    // video_stdin: Mutex<Option<std::process::ChildStdin>>,
    // data_stdin: Mutex<Option<std::process::ChildStdin>>,
    video_socket: UdpSocket,
    video_target: String,
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
    let _ = state.video_socket.send_to(&image_arr, state.video_target.as_str());
}

fn main() {

    let video_socket = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind to video socket");
    let video_target = "239.0.0.2:8888".to_string();

    let ffmpeg_command = "-c:v mjpeg -i udp://239.0.0.2:8888 -map 0:v -c copy -f mpegts udp://239.0.0.1:8000";

    let _ = Command::new("ffmpeg")
        .args(ffmpeg_command.split(" "))
        .spawn()
        .expect("Failed to start ffmpeg multicast process");


    tauri::Builder::default()
        .manage(AppSharedState {video_socket, video_target})
        .invoke_handler(tauri::generate_handler![
            send_packet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

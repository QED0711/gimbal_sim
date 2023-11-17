// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write, path::Path, process::{Command, Stdio}, sync::Mutex};
use tauri::State;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct AppSharedState {
    video_stdin: Mutex<Option<std::process::ChildStdin>>,
    data_stdin: Mutex<Option<std::process::ChildStdin>>,
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
    let mut data_stdin = state.data_stdin.lock().unwrap();

    if let Some(stdin) = video_stdin.as_mut() {
        stdin.write_all(&image_arr).expect("failed to write to video stdin");
    }

    // let dummy_data: Vec<u8> = vec![0, 1, 126, 127];
    // if let Some(stdin) = data_stdin.as_mut() {
    //     stdin.write_all(&dummy_data).expect("failed to write to data stdin");
    // }
}

fn main() {

    let video_command = "-f image2pipe -c:v mjpeg -i - -f mpegts udp://127.0.0.1:8888"; // video only
    let data_command = "-f data -i - -c copy -f mpegts udp://127.0.0.1:8889"; // video & data
    let multicast_command = "-i udp://127.0.0.1:8888 -i udp://127.0.0.1:8889 -map 0 -map 1 -c copy -f mpegts udp://239.0.0.1:8000";

    let ffmpeg_video = Command::new("ffmpeg")
        .args(video_command.split(" "))
        .stdin(Stdio::piped())
        .spawn()
        .expect("Failed to start FFmpeg Video Stream");

    let ffmpeg_data = Command::new("ffmpeg")
        .args(data_command.split(" "))
        .stdin(Stdio::piped())
        .spawn()
        .expect("Failed to start FFmpeg Data Stream");

    let ffmpeg_multicast = Command::new("ffmpeg")
        .args(multicast_command.split(" "))
        .spawn()
        .expect("Failed to start FFmpeg Multicast Stream");

    let video_stdin = Mutex::new(ffmpeg_video.stdin);
    let data_stdin = Mutex::new(ffmpeg_data.stdin);


    tauri::Builder::default()
        .manage(AppSharedState {video_stdin, data_stdin})
        .invoke_handler(tauri::generate_handler![
            send_packet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

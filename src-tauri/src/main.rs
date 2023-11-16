// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write, path::Path, process::{Command, Stdio}, sync::Mutex};
use tauri::State;
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

struct AppSharedState {
    ffmpeg_stdin: Mutex<Option<std::process::ChildStdin>>,
}

#[allow(dead_code)]
fn save_image_to_disk(data: Vec<u8>){
    let user = std::env::var("USERNAME").unwrap_or("/".into());
    let path_string = format!("/home/{user}/app/image.jpg");
    let mut file = File::create(Path::new(&path_string)).expect("Failed to create file");
    file.write_all(&data).expect("Failed to write to disk");
}


#[tauri::command]
fn receive_image(state: State<AppSharedState>, image_arr: Vec<u8>) {
    let mut ffmpeg_stdin = state.ffmpeg_stdin.lock().unwrap();
    if let Some(stdin) = ffmpeg_stdin.as_mut() {
        stdin.write_all(&image_arr).expect("failed to write to stdin")
    }
    // ffmpeg_stdin.write_all(&image_arr).expect("failed to write to stdin");
}

fn main() {

    let ffmpeg = Command::new("ffmpeg")
        .args(["-f", "image2pipe", "-c:v", "mjpeg", "-i", "-", "-f", "mpegts", "udp://239.0.0.1:8888"])
        .stdin(Stdio::piped())
        .spawn()
        .expect("Failed to start FFmpeg");

    let ffmpeg_stdin = Mutex::new(ffmpeg.stdin);


    tauri::Builder::default()
        .manage(AppSharedState {ffmpeg_stdin})
        .invoke_handler(tauri::generate_handler![
            receive_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

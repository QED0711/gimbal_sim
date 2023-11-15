// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::File, io::Write, path::Path};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn say_something_else(s: &str) -> String {
    println!("{}", s);
    format!("THIS IS FROM TAURI: {}", s)
}

fn save_image_to_disk(data: Vec<u8>){
    let user = std::env::var("USERNAME").unwrap_or("/".into());
    let path_string = format!("/home/{user}/app/image.jpg");
    let mut file = File::create(Path::new(&path_string)).expect("Failed to create file");
    file.write_all(&data).expect("Failed to write to disk");
}

#[tauri::command]
fn receive_image(image_arr: Vec<u8>) {
    // save_image_to_disk(image_arr);
    println!("{:?}", image_arr.len());
}

fn main() {
    println!("Hello from Tauri");
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet, 
            say_something_else, 
            receive_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

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

#[tauri::command]
fn receive_image(image_arr: Vec<u8>) {
    println!("{:?}", image_arr);
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![say_something_else])
        .invoke_handler(tauri::generate_handler![receive_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

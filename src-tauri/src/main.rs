// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod utils;
mod config;
mod cmd;
mod klv;

use std::{ sync::{Arc, Mutex}, env};
use gstreamer as gst;
use gstreamer::prelude::*;

use utils::AppSharedState;
use config::{parse_config, retrieve_config};
use cmd::{data::{send_video_packet, send_metadata_packet}, stream::{create_video_appsrc, create_klv_appsrc, create_pipeline}};


fn main() {
    // See here: https://stackoverflow.com/questions/64983204/merge-two-appsrc-pipelines-into-1-mpeg-ts-stream

    env::set_var("RUST_BACKTRACE", "full");
    // env::set_var("GST_DEBUG", "*:WARN,*:ERROR");
    env::set_var("GST_DEBUG", "0");

    
    let config = parse_config();

    // GStreamer Setup
    // Initialize GStreamer
    gst::init().expect("Failed to init gstreamer");

    // Create the elements
    let video_appsrc = create_video_appsrc();
    let klv_appsrc = create_klv_appsrc();

    // Pipeline Setup
    let pipeline = create_pipeline(&video_appsrc, &klv_appsrc, "239.0.0.1", "8000");

    // Start pipeline
    pipeline.set_state(gst::State::Playing).expect("Failed to set pipeline to playing");

    let shared_state: AppSharedState = utils::AppSharedState{
        video_appsrc: Arc::new(Mutex::new(video_appsrc)),
        klv_appsrc: Arc::new(Mutex::new(klv_appsrc)),
        config
    };

    tauri::Builder::default()
        .manage(shared_state)
        .invoke_handler(tauri::generate_handler![
            send_video_packet,
            send_metadata_packet,
            retrieve_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

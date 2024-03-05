// Prevents additional console window on Windows in release, DO NOT REMOVE!!
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod utils;
mod config;
mod cmd;
mod klv;

use std::{ sync::{Arc, Mutex}, env};
use gstreamer as gst;

use utils::{AppSharedState, start_image_processing_thread, start_hud_processing_thread};
use clap::Parser;
use config::{parse_config, retrieve_config, Args};
use cmd::{data::{send_video_packet, send_hud_packet, send_metadata_packet}, stream::{ImageType, create_video_appsrc, create_klv_appsrc, create_pipeline_simple, create_pipeline, start_pipeline, pause_pipeline}};


fn main() {
    // See here: https://stackoverflow.com/questions/64983204/merge-two-appsrc-pipelines-into-1-mpeg-ts-stream

    let args = Args::parse();
    let username = env::var("USERNAME").expect("Could not get system username");
    println!("{:?}", args);
    env::set_var("RUST_BACKTRACE", "full");
    // env::set_var("GST_DEBUG", "*:WARN,*:ERROR");
    // env::set_var("GST_DEBUG", "nv*:6");
    env::set_var("GST_DEBUG_DUMP_DOT_DIR", format!("/home/{username}/app"));

    
    let config = parse_config();

    // GStreamer Setup
    // Initialize GStreamer
    gst::init().expect("Failed to init gstreamer");

    // Create the elements
    let video_appsrc = create_video_appsrc(ImageType::Jpeg);
    let hud_appsrc = create_video_appsrc(ImageType::Jpeg);
    let klv_appsrc = create_klv_appsrc();

    // Pipeline Setup
    let pipeline = create_pipeline_simple(&video_appsrc, &klv_appsrc, &config.stream_address, &config.stream_port);
    // let pipeline = create_pipeline(&video_appsrc, &hud_appsrc, &klv_appsrc, &config.stream_address, &config.stream_port, config.fps, config.hud_fps, config.overlay_alpha);

    if (args.gst_debug) {
        println!("DEBUGGING PIPELINE GRAPH");
        gst::debug_bin_to_dot_file(&pipeline, gst::DebugGraphDetails::VERBOSE, "pipeline");
    }

    // Start pipeline
    // pipeline.set_state(gst::State::Playing).expect("Failed to set pipeline to playing");

    let shared_state: AppSharedState = utils::AppSharedState{
        gst_pipeline: Arc::new(Mutex::new(pipeline)),
        video_appsrc: Arc::new(Mutex::new(video_appsrc)),
        hud_appsrc: Arc::new(Mutex::new(hud_appsrc)),
        klv_appsrc: Arc::new(Mutex::new(klv_appsrc)),
        config: config.clone(),
        cur_image: Arc::new(Mutex::new(None)),
        cur_overlay: Arc::new(Mutex::new(None)),
    };

    let shared_state_arc = Arc::new(shared_state);

    let video_rate = (1000.0 / config.fps as f64).round() as u64;
    let hud_rate = (1000.0 / config.hud_fps as f64).round() as u64;
    start_image_processing_thread(Arc::clone(&shared_state_arc), video_rate); 
    start_hud_processing_thread(Arc::clone(&shared_state_arc), hud_rate);

    tauri::Builder::default()
        .manage(Arc::clone(&shared_state_arc))
        .invoke_handler(tauri::generate_handler![
            start_pipeline,
            pause_pipeline,
            send_video_packet,
            send_hud_packet,
            send_metadata_packet,
            retrieve_config,
        ])
        .plugin(tauri_plugin_gamepad::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

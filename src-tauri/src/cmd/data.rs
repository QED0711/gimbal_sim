use crate::klv::MISB601;

use super::super::utils;
use std::time::{SystemTime, UNIX_EPOCH, Instant, Duration};
use std::fs::OpenOptions;
use std::io::{self, Write};
use std::sync::Mutex;
use std::collections::HashMap;
use once_cell::sync::Lazy;

use tauri::State;
use gstreamer as gst;
use serde::Deserialize;


const VIDEO_FRAMERATE: u64 = 30;
const VIDEO_FRAME_DURATION_MS: u64 = 1000 / VIDEO_FRAMERATE;
const KLV_FRAME_DURATION_MS: u64 = VIDEO_FRAMERATE / 3;

static LAST_CALL: Lazy<Mutex<Option<Instant>>> = Lazy::new(|| Mutex::new(None));

fn print_elapsed_time() {
    let mut last_call = LAST_CALL.lock().unwrap(); // Lock the mutex to access the last call time
    let now = Instant::now();

    match *last_call {
        Some(last_instant) => {
            let elapsed = now.duration_since(last_instant);
            println!("Time since last call: {:.2?}", elapsed);
        }
        None => println!("First call"),
    }

    *last_call = Some(now); // Update the last call time to now
}


struct StreamTiming {
    start_time: Instant,
    frame_count: u64,
}

static STREAM_TIMINGS: Lazy<Mutex<HashMap<String, StreamTiming>>> = Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct Metadata {
    pub precisionTimeStamp: u64, // 2
    pub missionID: String, // 3
    pub platformTailNumber: String, // 4

    pub platformHeadingAngle: f64, // 5
    pub platformPitchAngle: f64, // 6
    pub platformRollAngle: f64, // 7
    pub platformTrueAirSpeed: u8, // 8

    pub platformDesignation: String, // 10
    pub imageSourceSensor: String,
    pub imageCoordinateSystem: String,

    pub sensorLatitude: f64, // 13
    pub sensorLongitude: f64, // 14
    pub sensorTrueAltitude: f64, // 15

    pub hfov: f64,
    pub vfov: f64,

    pub sensorRelativeAzimuthAngle: f64,
    pub sensorRelativeElevationAngle: f64,
    pub sensorRelativeRollAngle: f64,

    pub frameCenterLatitude: f64,
    pub frameCenterLongitude: f64,
    pub frameCenterAltitude: f64,
}


#[tauri::command]
pub fn send_video_packet(state: State<utils::AppSharedState>, image_arr: Vec<u8>) {
    let video_appsrc = state.video_appsrc.lock().unwrap();
    let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create image gst buffer");
    timestamp_buffer("video", &mut image_buf, &image_arr);

    print_elapsed_time();
    // println!("timestamp: {:?}", image_buf);
    video_appsrc.push_buffer(image_buf).expect("Failed to push to image buffer");
}

#[tauri::command]
pub fn send_hud_packet(state: State<utils::AppSharedState>, image_arr: Vec<u8>) {
    let hud_appsrc = state.hud_appsrc.lock().unwrap();
    let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create hud gst buffer");
    timestamp_buffer("hud", &mut image_buf, &image_arr);
    hud_appsrc.push_buffer(image_buf).expect("Failed to push to hud buffer");
}

#[tauri::command]
pub fn send_metadata_packet(state: State<utils::AppSharedState>, metadata: Metadata ) {
    let klv_metadata = MISB601::Klv::from(metadata);
    let klv = klv_metadata.encode_to_klv();

    let klv_appsrc = state.klv_appsrc.lock().unwrap();

    let mut klv_buf = gst::Buffer::with_size(klv.len()).expect("Failed to create klv gst buffer");
    timestamp_buffer("klv", &mut klv_buf, &klv);

    klv_appsrc.push_buffer(klv_buf).expect("Failed to push to klv buffer");

}


// #[allow(dead_code)]
fn timestamp_buffer(stream_id: &str, buffer: &mut gst::Buffer, data: &Vec<u8>){

    let mut timings = STREAM_TIMINGS.lock().unwrap();
    let timing = timings.entry(stream_id.to_string()).or_insert_with(|| StreamTiming {
        start_time: Instant::now(),
        frame_count: 0,
    });

    // Calculate the PTS based on the frame count and known framerate
    let pts: gst::ClockTime;
    if stream_id == "klv" {
        pts = gst::ClockTime::from_mseconds(timing.frame_count * KLV_FRAME_DURATION_MS);
    } else {
        pts = gst::ClockTime::from_mseconds(timing.frame_count * VIDEO_FRAME_DURATION_MS);
    }
    timing.frame_count += 1;

    // Update the buffer properties
    let buffer = buffer.get_mut().unwrap();
    buffer.set_pts(pts);
    // buffer.set_pts(pts);
    buffer.set_dts(pts); // DTS is often the same as PTS for decoded video frames
    // buffer.set_duration(gst::ClockTime::from_mseconds(VIDEO_FRAME_DURATION_MS));
    buffer.set_duration(gst::ClockTime::from_mseconds(0 as u64));


    let _ = buffer.copy_from_slice(0, data);

    // OLD LOGIC
    // let buffer = buffer.get_mut().unwrap();
    // let _ = buffer.copy_from_slice(0, data);

    // let now = SystemTime::now().duration_since(UNIX_EPOCH)
    //     .expect("Time went backwards");

    // let pts = gst::ClockTime::from_mseconds(now.as_millis() as u64);

    // buffer.set_pts(pts);
    // buffer.set_dts(pts);
    // buffer.set_duration(pts);
    // buffer.set_offset(now.as_millis() as u64);

}


fn append_to_file(file_path: &str, data: &Vec<u8>) {
    let mut file = OpenOptions::new()
        .append(true)
        .create(true)
        .open(file_path)
        .expect("failed to open file");

    file.write_all(data)
        .expect("Failed to write to file");

}
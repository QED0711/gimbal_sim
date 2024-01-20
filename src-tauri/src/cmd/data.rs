use crate::klv::MISB601;

use super::super::utils;
use std::time::{SystemTime, UNIX_EPOCH};
use std::fs::OpenOptions;
use std::io::{self, Write};
use std::env;
use rand::Rng;
use tauri::State;
use gstreamer as gst;
use serde::Deserialize;



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
pub fn send_packet(state: State<utils::AppSharedState>, image_arr: Vec<u8>, metadata: Metadata) {
    // println!("{:?}, {:?}", metadata.sensorTrueAltitude, metadata.sensorLongitude);
    // let klv = generate_fake_klv_data(32);

    let klv_metadata = MISB601::Klv::from(metadata);
    let klv = klv_metadata.encode_to_klv();

    // let file_path = env::current_dir().unwrap().into_os_string().into_string().unwrap();
    // let file_path  = format!("{}/../python/klv_raw.bin", file_path);
    // append_to_file(&file_path, &klv);
    // println!("{:?}", klv);
    // panic!("Exiting early");

    let video_appsrc = state.video_appsrc.lock().unwrap();
    let klv_appsrc = state.klv_appsrc.lock().unwrap();
    
    let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create image gst buffer");
    timestamp_buffer(&mut image_buf, &image_arr);

    let mut klv_buf = gst::Buffer::with_size(klv.len()).expect("Failed to create klv gst buffer");
    timestamp_buffer(&mut klv_buf, &klv);
    
    video_appsrc.push_buffer(image_buf).expect("Failed to push to image buffer");
    klv_appsrc.push_buffer(klv_buf).expect("Failed to push to klv buffer");
}


// #[allow(dead_code)]
fn timestamp_buffer(buffer: &mut gst::Buffer, data: &Vec<u8>){
    let buffer = buffer.get_mut().unwrap();
    let _ = buffer.copy_from_slice(0, data);

    let now = SystemTime::now().duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    // let now = TIMESTAMP_COUNTER.fetch_add(BUFFER_DURATION_MS, Ordering::SeqCst);
    let pts = gst::ClockTime::from_mseconds(now.as_millis() as u64);
    // let pts = gst::ClockTime::from_mseconds(now);
    buffer.set_pts(pts);
    buffer.set_dts(pts);
    buffer.set_duration(pts);
    buffer.set_offset(now.as_millis() as u64);

    // buffer.set_dts(pts + gst::ClockTime::from_mseconds(BUFFER_DURATION_MS));
    // buffer.set_duration(gst::ClockTime::from_mseconds(BUFFER_DURATION_MS));
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
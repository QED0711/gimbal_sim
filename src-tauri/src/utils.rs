use std::sync::{Arc, Mutex};
use std::{thread, time::Duration};
use gstreamer_app as gst_app;
use gstreamer as gst;
use crate::config;
use crate::cmd::data::timestamp_buffer;

pub struct AppSharedState {
    pub gst_pipeline: Arc<Mutex<gst::Pipeline>>,
    pub video_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub hud_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub klv_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub config: config::Config, 

    pub cur_image: Arc<Mutex<Option<Vec<u8>>>>,
    pub cur_overlay: Arc<Mutex<Option<Vec<u8>>>>,
}

pub fn start_image_processing_thread(state: Arc<AppSharedState>, rate: u64) {
    let image = Arc::clone(&state.cur_image);
    thread::spawn(move || {
        loop {
            let image_arr = {
                let packet = image.lock().unwrap();
                packet.clone()
            };
            if let Some(image_arr) = image_arr {
                // println!("IMAGE: {:?}", image_arr.len());
                let video_appsrc = state.video_appsrc.lock().unwrap();
                let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create image gst buffer");
                timestamp_buffer(&mut image_buf, &image_arr);
                video_appsrc.push_buffer(image_buf).expect("Failed to push to image buffer");
            }

            thread::sleep(Duration::from_millis(rate));
        }
    });
}

pub fn start_hud_processing_thread(state: Arc<AppSharedState>, rate: u64) {
    let hud = Arc::clone(&state.cur_overlay);
    thread::spawn(move || {
        loop {
            let image_arr = {
                let packet = hud.lock().unwrap();
                packet.clone()
            };
            if let Some(image_arr) = image_arr {
                // println!("HUD: {:?}", image_arr.len());
                let hud_appsrc = state.hud_appsrc.lock().unwrap();
                let mut image_buf = gst::Buffer::with_size(image_arr.len()).expect("Failed to create hud gst buffer");
                timestamp_buffer(&mut image_buf, &image_arr);
                hud_appsrc.push_buffer(image_buf).expect("Failed to push to hud buffer");
            }

            thread::sleep(Duration::from_millis(rate));
        }
    });
}

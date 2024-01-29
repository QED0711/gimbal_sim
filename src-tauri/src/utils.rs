use std::sync::{Arc, Mutex};
use gstreamer_app as gst_app;
use serde::{Serialize, Deserialize};

pub struct AppSharedState {
    pub video_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub klv_appsrc: Arc<Mutex<gst_app::AppSrc>>,
}


#[derive(Serialize, Deserialize, PartialEq, Debug)]
struct Config {
    mission_name: String
}
use std::sync::{Arc, Mutex};
use gstreamer_app as gst_app;
use gstreamer as gst;
use crate::config;

pub struct AppSharedState {
    pub gst_pipeline: Arc<Mutex<gst::Pipeline>>,
    pub video_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub hud_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub klv_appsrc: Arc<Mutex<gst_app::AppSrc>>,
    pub config: config::Config, 
}

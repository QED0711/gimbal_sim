use std::sync::Arc;
use gst::Pipeline;
use gstreamer as gst;
use gstreamer_app as gst_app;
use gstreamer::prelude::*;
use tauri::State;

use crate::utils;


// See here: https://stackoverflow.com/questions/64983204/merge-two-appsrc-pipelines-into-1-mpeg-ts-stream
pub enum ImageType {
    Jpeg,
    Png
}

pub fn create_video_appsrc(image_type: ImageType) -> gst_app::AppSrc {

    let video_appsrc = gst::ElementFactory::make("appsrc")
        .build()
        .expect("Could not create video_appsrc element.")
        .dynamic_cast::<gst_app::AppSrc>()
        .expect("Failed to cast to Video AppSrc");
    let video_caps = match (image_type) {
        ImageType::Jpeg => gst::caps::Caps::builder("image/jpeg")
            .field("width", &1280)
            .field("height", &720)
            .field("framerate", &gst::Fraction::new(0, 1))
            .build(),
        ImageType::Png => gst::caps::Caps::builder("image/png")
            .field("width", &1280)
            .field("height", &720)
            .field("framerate", &gst::Fraction::new(0, 1))
            .build(),
    };

    video_appsrc.set_caps(Some(&video_caps));

    video_appsrc.set_is_live(true);
    video_appsrc.set_format(gst::Format::Time);

    video_appsrc
}

pub fn create_klv_appsrc() -> gst_app::AppSrc {
    
    let klv_appsrc = gst::ElementFactory::make("appsrc")
        .build()
        .expect("Could not create klv_appsrc element.")
        .dynamic_cast::<gst_app::AppSrc>()
        .expect("Failed to cast to KLV AppSrc");


    let klv_caps = gst::caps::Caps::builder("meta/x-klv")
        .field("parsed", true)
        .build();
    klv_appsrc.set_caps(Some(&klv_caps));

    klv_appsrc.set_is_live(true);
    klv_appsrc.set_format(gst::Format::Time);

    klv_appsrc
}

#[tauri::command]
pub fn start_pipeline(state: State<Arc<utils::AppSharedState>>) -> bool {
    let pipeline = state.inner().gst_pipeline.lock().unwrap();
    pipeline.set_state(gst::State::Playing).expect("Failed to start pipeline");
    true
}

#[tauri::command]
pub fn pause_pipeline(state: State<Arc<utils::AppSharedState>>) -> bool {
    let pipeline = state.inner().gst_pipeline.lock().unwrap();
    pipeline.set_state(gst::State::Paused).expect("Failed to pause pipeline");
    true
}

pub fn create_pipeline_simple(
    video_appsrc: &gst_app::AppSrc, 
    klv_appsrc: &gst_app::AppSrc, 
    out_host: &str, out_port: &str, 
) -> Pipeline {
    let jpegparse = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse");
    let jpegdec = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec");
    let videoconvert = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert");
    let x264enc = gst::ElementFactory::make("x264enc").build().expect("failed to build x264enc");
    let video_queue = gst::ElementFactory::make("queue").build().expect("failed to build videoqueue");
    let klv_queue = gst::ElementFactory::make("queue").build().expect("failed to build klvqueue");
    let mpegtsmux = gst::ElementFactory::make("mpegtsmux").build().expect("failed to build mpegtsmux");
    let udpsink = gst::ElementFactory::make("udpsink").build().expect("failed to build udpsink");

    x264enc.set_property_from_str("tune", "zerolatency");
    x264enc.set_property_from_str("key-int-max", "30");

    video_queue.set_property_from_str("max-size-buffers", "5");
    video_queue.set_property_from_str("max-size-time", "100000000");
    klv_queue.set_property_from_str("max-size-buffers", "5");
    klv_queue.set_property_from_str("max-size-time", "100000000");

    mpegtsmux.set_property_from_str("alignment", "-1");
    mpegtsmux.set_property("latency", 10 as u64);

    udpsink.set_property_from_str("host", out_host);
    udpsink.set_property_from_str("port", out_port);
    udpsink.set_property("sync", false);
    udpsink.set_property("async", false);
    udpsink.set_property_from_str("buffer-size", "0");


    let pipeline = gst::Pipeline::new();

    pipeline.add_many(&[
        &video_appsrc.upcast_ref(),
        &jpegparse,
        &jpegdec,
        &videoconvert,
        &x264enc,
        &video_queue,
        &klv_queue,
        &klv_appsrc.upcast_ref(),
        &mpegtsmux,
        &udpsink,
    ])
    .expect("failed to add to pipeline");

    gst::Element::link_many(&[
        &video_appsrc.upcast_ref(),
        &jpegparse,
        &jpegdec,
        &videoconvert,
        &x264enc,
        &video_queue,
        &mpegtsmux,
    ])
    .expect("failed to link_many");


    klv_appsrc.link(&klv_queue).expect("Failed to link klvsrc to klv_queue element"); // without queue in between
    klv_queue.link(&mpegtsmux).expect("failed to link klv_queue to mpegtsmux element");
    // klv_appsrc.link(&mpegtsmux).expect("Failed to link klvsrc to mpegtsmux element"); // without queue in between
    mpegtsmux.link(&udpsink).expect("Failed to link mpegtsmux to udpsink");

    return pipeline;
}

pub fn create_pipeline(
    video_appsrc: &gst_app::AppSrc, 
    hud_appsrc: &gst_app::AppSrc, 
    klv_appsrc: &gst_app::AppSrc, 
    out_host: &str, out_port: 
    &str, 
    fps: i32, 
    hud_fps: i32,
    overlay_alpha: f32
) -> Pipeline {

    let jpegparse_video = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse_video");
    let jpegdec_video = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec_video");
    let jpegparse_hud = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse_hud");
    let jpegdec_hud = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec_hud");
    
    let videoconvert_video = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert_video");
    let videoconvert_hud = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert_hud");
    
    let compositor = gst::ElementFactory::make("compositor").build().expect("failed to build compositor");
    let capsfilter_convert = gst::ElementFactory::make("capsfilter").build().expect("Failed to build videoconvert capsfilter");
    
    let x264enc = gst::ElementFactory::make("x264enc").build().expect("failed to build x264enc");
    // let x264enc = gst::ElementFactory::make("nvh264enc").build().expect("failed to build x264enc");

    let video_queue = gst::ElementFactory::make("queue").build().expect("failed to build videoqueue");
    let hud_queue = gst::ElementFactory::make("queue").build().expect("failed to build klvqueue");
    let mpegtsmux = gst::ElementFactory::make("mpegtsmux").build().expect("failed to build mpegtsmux");
    let udpsink = gst::ElementFactory::make("udpsink").build().expect("failed to build udpsink");
    
    let fdsink = gst::ElementFactory::make("fdsink").build().expect("failed to build fdsink");

    let convert_caps = gst::caps::Caps::builder("video/x-raw")
        .field("format", "I420")
        .field("width", &1280)
        .field("height", &720)
        .field("framerate", &gst::Fraction::new(fps, 1))
        .build();

    let h264_caps = gst::caps::Caps::builder("video/x-h264")
        .field("width", &1280)
        .field("height", &720)
        .field("framerate", &gst::Fraction::new(fps, 1))
        .build();
    
    compositor.set_property_from_str("background", "3");
    compositor.set_property_from_str("latency", "10");

    let sinkpad_video = compositor.request_pad_simple("sink_0").unwrap();
    let sinkpad_hud = compositor.request_pad_simple("sink_1").unwrap();

    sinkpad_video.set_property("xpos", 0);
    sinkpad_video.set_property("ypos", 0);
    sinkpad_video.set_property("width", 1280);
    sinkpad_video.set_property("height", 720);
    sinkpad_video.set_property_from_str("operator", "2");

    sinkpad_hud.set_property("xpos", 0);
    sinkpad_hud.set_property("ypos", 0);
    sinkpad_hud.set_property("width", 1280);
    sinkpad_hud.set_property("height", 720);
    sinkpad_hud.set_property_from_str("alpha",&format!("{overlay_alpha}"));
    sinkpad_hud.set_property_from_str("operator", "2");

    capsfilter_convert.set_property("caps", &convert_caps);

    x264enc.set_property_from_str("tune", "zerolatency");
    // x264enc.set_property_from_str("speed-preset", "ultrafast");
    x264enc.set_property_from_str("key-int-max", "30");
    
    // nvidia version
    // x264enc.set_property_from_str("zerolatency", "true");

    mpegtsmux.set_property_from_str("alignment", "-1");
    mpegtsmux.set_property("latency", 10 as u64);

    udpsink.set_property_from_str("host", out_host);
    udpsink.set_property_from_str("port", out_port);
    udpsink.set_property("sync", false);
    udpsink.set_property("async", false);
    udpsink.set_property_from_str("buffer-size", "0");

    let pipeline = gst::Pipeline::new();

    pipeline.add_many(&[
        &video_appsrc.upcast_ref(),
        &hud_appsrc.upcast_ref(),
        &jpegparse_video,
        &jpegdec_video,
        &jpegparse_hud,
        &jpegdec_hud,
        &videoconvert_video,
        &videoconvert_hud,
        &compositor,
        &capsfilter_convert,
        &x264enc,
        &klv_appsrc.upcast_ref(),
        &mpegtsmux,
        &udpsink,
        &fdsink,
    ])
    .expect("failed to add to pipeline");

    gst::Element::link_many(&[
        &video_appsrc.upcast_ref(),
        &jpegparse_video,
        &jpegdec_video,
        &videoconvert_video,
        &compositor,
    ])
    .expect("failed to link video pipeline");

    gst::Element::link_many(&[
        &hud_appsrc.upcast_ref(),
        &jpegparse_hud,
        &jpegdec_hud,
        &videoconvert_hud,
        &compositor,
    ])
    .expect("failed to link hud video pipeline");

    gst::Element::link_many(&[
        &klv_appsrc.upcast_ref(),
        &mpegtsmux,
    ])
    .expect("failed to link klv pipeline");

    gst::Element::link_many(&[
        &compositor,
        &capsfilter_convert,
        &x264enc,
        &mpegtsmux,
        &udpsink,
    ])
    .expect("failed to link tial of pipeline");

    return pipeline;
}

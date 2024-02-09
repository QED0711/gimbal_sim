use gst::Pipeline;
use gstreamer as gst;
use gstreamer_app as gst_app;
use gstreamer::prelude::*;
use tauri::State;

use crate::utils;


// See here: https://stackoverflow.com/questions/64983204/merge-two-appsrc-pipelines-into-1-mpeg-ts-stream

pub fn create_video_appsrc() -> gst_app::AppSrc {

    let video_appsrc = gst::ElementFactory::make("appsrc")
        .build()
        .expect("Could not create video_appsrc element.")
        .dynamic_cast::<gst_app::AppSrc>()
        .expect("Failed to cast to Video AppSrc");
    let video_caps = gst::caps::Caps::builder("image/jpeg")
        .field("width", &1280)
        .field("height", &720)
        .field("framerate", &gst::Fraction::new(0, 1))
        .build();

    video_appsrc.set_caps(Some(&video_caps));

    video_appsrc.set_is_live(true);
    video_appsrc.set_format(gst::Format::Time);

    return video_appsrc;
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

    return klv_appsrc;
}


pub fn create_pipeline(video_appsrc: &gst_app::AppSrc, hud_appsrc: &gst_app::AppSrc, klv_appsrc: &gst_app::AppSrc, out_host: &str, out_port: &str) -> Pipeline {

    let jpegparse_video = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse_video");
    let jpegdec_video = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec_video");
    let jpegparse_hud = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse_hud");
    let jpegdec_hud = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec_hud");
    
    let capsfilter_video = gst::ElementFactory::make("capsfilter").build().expect("Failed to build video capsfilter");
    let capsfilter_hud = gst::ElementFactory::make("capsfilter").build().expect("Failed to build hud capsfilter");
    
    let videoconvert_video = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert_video");
    let videoconvert_hud = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert_hud");
    
    let videorate_video = gst::ElementFactory::make("videorate").build().expect("failed to build videorate_video");
    let videorate_hud = gst::ElementFactory::make("videorate").build().expect("failed to build videorate_hud");

    let capsfilter_videorate_video = gst::ElementFactory::make("capsfilter").build().expect("failed to build capsfilter_videorate_video");
    let capsfilter_videorate_hud = gst::ElementFactory::make("capsfilter").build().expect("failed to build capsfilter_videorate_hud");

    let compositor = gst::ElementFactory::make("compositor").build().expect("failed to build compositor");
    let capsfilter_convert = gst::ElementFactory::make("capsfilter").build().expect("Failed to build videoconvert capsfilter");

    let x264enc = gst::ElementFactory::make("x264enc").build().expect("failed to build x264enc");
    let video_queue = gst::ElementFactory::make("queue").build().expect("failed to build videoqueue");
    let hud_queue = gst::ElementFactory::make("queue").build().expect("failed to build klvqueue");
    let mpegtsmux = gst::ElementFactory::make("mpegtsmux").build().expect("failed to build mpegtsmux");
    let udpsink = gst::ElementFactory::make("udpsink").build().expect("failed to build udpsink");
    
    let fdsink = gst::ElementFactory::make("fdsink").build().expect("failed to build fdsink");

    let jpegdec_caps = gst::caps::Caps::builder("video/x-raw")
        .field("format", "I420")
        .field("width", &1280)
        .field("height", &720)
        .field("framerate", &gst::Fraction::new(0, 1))
        .build();

    let videorate_caps = gst::caps::Caps::builder("video/x-raw")
        .field("format", "I420")
        .field("width", 1280)
        .field("height", 720)
        .field("framerate", &gst::Fraction::new(10, 1))
        .build();

    
    capsfilter_video.set_property("caps", &jpegdec_caps);
    capsfilter_hud.set_property("caps", &jpegdec_caps);
    

    videorate_video.set_property_from_str("max-duplication-time", "100000000");
    videorate_video.set_property_from_str("skip-to-first", "true");
    videorate_hud.set_property_from_str("max-duplication-time", "100000000");
    videorate_hud.set_property_from_str("skip-to-first", "true");

    capsfilter_videorate_video.set_property("caps", &videorate_caps);
    capsfilter_videorate_hud.set_property("caps", &videorate_caps);

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
    sinkpad_hud.set_property("alpha", 0.4);
    sinkpad_hud.set_property_from_str("operator", "2");

    capsfilter_convert.set_property("caps", &jpegdec_caps);

    x264enc.set_property_from_str("tune", "zerolatency");
    x264enc.set_property_from_str("key-int-max", "30");

    video_queue.set_property_from_str("max-size-buffers", "5");
    video_queue.set_property_from_str("max-size-time", "100000000");
    video_queue.set_property_from_str("leaky", "1");
    hud_queue.set_property_from_str("max-size-buffers", "5");
    hud_queue.set_property_from_str("max-size-time", "100000000");
    hud_queue.set_property_from_str("leaky", "1");

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
        // &capsfilter_video,
        // &capsfilter_hud,
        // &capsfilter_convert,
        &videoconvert_video,
        &videoconvert_hud,

        &video_queue,
        &hud_queue,

        &videorate_video,
        &videorate_hud,
        &capsfilter_videorate_video,
        &capsfilter_videorate_hud,

        &compositor,
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
        &video_queue,
        &videorate_video,
        &capsfilter_videorate_video,
        // &capsfilter_video,
        &compositor,
    ])
    .expect("failed to link video pipeline");

    gst::Element::link_many(&[
        &hud_appsrc.upcast_ref(),
        &jpegparse_hud,
        &jpegdec_hud,
        &videoconvert_hud,
        &hud_queue,
        &videorate_hud,
        &capsfilter_videorate_hud,
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
        // &capsfilter_convert,
        // &videoconvert_video,
        &x264enc,
        &mpegtsmux,
        &udpsink,
    ])
    .expect("failed to link tial of pipeline");

    return pipeline;
}

#[tauri::command]
pub fn start_pipeline(state: State<utils::AppSharedState>) -> bool {
    let pipeline = state.gst_pipeline.lock().unwrap();
    pipeline.set_state(gst::State::Playing).expect("Failed to start pipeline");
    return true
}

#[tauri::command]
pub fn pause_pipeline(state: State<utils::AppSharedState>) -> bool {
    let pipeline = state.gst_pipeline.lock().unwrap();
    pipeline.set_state(gst::State::Paused).expect("Failed to pause pipeline");
    return true
}


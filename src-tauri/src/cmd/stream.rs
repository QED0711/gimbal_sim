use gst::Pipeline;
use gstreamer as gst;
use gstreamer_app as gst_app;
use gstreamer::prelude::*;

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
        .field("framerate", &gst::Fraction::new(20, 1))
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


pub fn create_pipeline(video_appsrc: &gst_app::AppSrc, klv_appsrc: &gst_app::AppSrc, out_host: &str, out_port: &str) -> Pipeline {

    let jpegparse = gst::ElementFactory::make("jpegparse").build().expect("failed to build jpegparse");
    let jpegdec = gst::ElementFactory::make("jpegdec").build().expect("failed to build jpegdec");
    let videoconvert = gst::ElementFactory::make("videoconvert").build().expect("failed to build videoconvert");
    let x264enc = gst::ElementFactory::make("x264enc").build().expect("failed to build x264enc");
    let video_queue = gst::ElementFactory::make("queue").build().expect("failed to build videoqueue");
    let klv_queue = gst::ElementFactory::make("queue").build().expect("failed to build klvqueue");
    let mpegtsmux = gst::ElementFactory::make("mpegtsmux").build().expect("failed to build mpegtsmux");
    let udpsink = gst::ElementFactory::make("udpsink").build().expect("failed to build udpsink");

    x264enc.set_property_from_str("tune", "zerolatency");

    mpegtsmux.set_property("alignment", 7);
    mpegtsmux.set_property("latency", 10 as u64);


    udpsink.set_property_from_str("host", out_host);
    udpsink.set_property_from_str("port", out_port);
    udpsink.set_property("sync", false);
    udpsink.set_property("async", false);


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
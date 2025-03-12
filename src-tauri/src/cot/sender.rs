use std::net::{SocketAddrV4, UdpSocket};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::thread;

/// Commands for the UDP sender thread.
pub enum CotUdpCommand {
    /// Command to send a CoT message (XML string) over UDP.
    SendCoTMessage(String),
}

/// Starts the UDP sender thread. The thread binds a UDP socket and waits for commands
/// on a channel. When it receives a CoT message, it sends it over UDP to the given multicast address.
pub fn start_udp_sender(multicast_addr: &str, port: u16) -> Sender<CotUdpCommand> {
    let (tx, rx): (Sender<CotUdpCommand>, Receiver<CotUdpCommand>) = mpsc::channel();
    let multicast_socket_addr: SocketAddrV4 = format!("{multicast_addr}:{port}")
        .parse()
        .expect("Invalid multicast address");

    // Bind to any available local port.
    let socket = UdpSocket::bind("0.0.0.0:0").expect("Couldn't bind to local address");

    // Optionally set socket options for multicast if required.
    // e.g. socket.set_multicast_loop_v4(true).expect("Couldn't set multicast loopback");

    thread::spawn(move || {
        for command in rx {
            match command {
                CotUdpCommand::SendCoTMessage(xml_message) => {
                    let data = xml_message.as_bytes();
                    if let Err(e) = socket.send_to(data, multicast_socket_addr) {
                        eprintln!("Failed to send UDP message: {:?}", e);
                    } else {
                        // println!("Sent CoT message:\n{}", xml_message);
                    }
                }
            }
        }
    });

    tx
}


pub struct UdpSenderHandle(pub Arc<Mutex<std::sync::mpsc::Sender<CotUdpCommand>>>);
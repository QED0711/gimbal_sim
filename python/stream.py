#!/usr/bin/python3
import os, sys, klvdata, pdb;

# klv_file = sys.argv[1]
# with open(klv_file, "rb") as fl:
#     klv = fl.read()
#     print(klv)

# exit(0)
while True:
    # data = os.read(0, 4096)
    data = sys.stdin.buffer.read()
    print(data)
    for packet in klvdata.StreamParser(data): 
    # packets = klvdata.StreamParser(sys.stdin.buffer.read()) 
    # packets = klvdata.StreamParser(klv)
    # pdb.set_trace()
    # for packet in packets: 
        print(packet)
        try:
            packet.structure()
            # pdb.set_trace()
        except:
            pass
            # print(packet)
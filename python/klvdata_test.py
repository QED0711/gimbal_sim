#!/usr/bin/python3
# from klvdata import klvdata
import klvdata
import sys, pdb
# data = sys.stdin.buffer.read();
with open(sys.argv[1], "rb") as fl:
    data = fl.read()

u8_data = [byte for byte in data]
# print(u8_data)
for packet in klvdata.StreamParser(data): 
    # pdb.set_trace()
    try:
        packet.structure()
        # print(packet.structure())
        # packet.structure()
    except Exception as e:
        print(e)
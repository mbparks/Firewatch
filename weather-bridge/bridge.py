#!/usr/bin/env python3
"""FIREWATCH local weather bridge.

Dependency-free localhost JSON bridge. Sensors/scripts may POST a FIREWATCH-style
weather object to /weather; the browser reads the latest object from GET /weather.
This reference bridge intentionally does not implement device-specific drivers.
"""
from __future__ import annotations
import argparse, json, threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

LOCK=threading.Lock(); STATE={"timestamp":datetime.now(timezone.utc).isoformat(),"notes":"No sensor sample received yet."}

def load_file(path:Path):
    global STATE
    if path.exists():
        data=json.loads(path.read_text())
        if isinstance(data,dict):
            with LOCK: STATE=data

def save_file(path:Path|None):
    if not path:return
    with LOCK:data=dict(STATE)
    path.write_text(json.dumps(data,indent=2)+"\n")

class Handler(BaseHTTPRequestHandler):
    store:Path|None=None
    def cors(self):
        self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Headers','Content-Type');self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
    def json_response(self,status:int,data):
        body=json.dumps(data).encode();self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.cors();self.end_headers();self.wfile.write(body)
    def do_OPTIONS(self):self.send_response(204);self.cors();self.end_headers()
    def do_GET(self):
        if self.path.rstrip('/') not in ('','/weather'):return self.json_response(404,{"error":"not found"})
        with LOCK:data=dict(STATE)
        self.json_response(200,data)
    def do_POST(self):
        if self.path.rstrip('/')!='/weather':return self.json_response(404,{"error":"not found"})
        try:
            length=int(self.headers.get('Content-Length','0'));data=json.loads(self.rfile.read(length) or b'{}')
            if not isinstance(data,dict):raise ValueError('JSON body must be an object')
            data.setdefault('timestamp',datetime.now(timezone.utc).isoformat())
            with LOCK:
                STATE.clear();STATE.update(data)
            save_file(self.store);self.json_response(200,{"ok":True,"timestamp":data['timestamp']})
        except Exception as exc:self.json_response(400,{"ok":False,"error":str(exc)})
    def log_message(self,fmt,*args):print(f"[weather-bridge] {self.address_string()} - {fmt%args}")

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--host',default='127.0.0.1');ap.add_argument('--port',type=int,default=8780);ap.add_argument('--store',default='weather-latest.json');args=ap.parse_args();store=Path(args.store) if args.store else None
    if store:load_file(store)
    Handler.store=store;server=ThreadingHTTPServer((args.host,args.port),Handler);print(f"FIREWATCH weather bridge: http://{args.host}:{args.port}/weather")
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()

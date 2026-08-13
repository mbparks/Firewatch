#!/usr/bin/env python3
"""Optional FIREWATCH v1.3 Meshtastic WebSocket bridge."""
import argparse, asyncio, json, signal
from pubsub import pub
import meshtastic.serial_interface, meshtastic.tcp_interface
import websockets
clients=set(); loop=None; iface=None; port_num=256

def emit(obj):
    if loop and loop.is_running(): asyncio.run_coroutine_threadsafe(broadcast(obj),loop)
async def broadcast(obj):
    msg=json.dumps(obj,default=str,separators=(',',':')); dead=[]
    for ws in list(clients):
        try: await ws.send(msg)
        except Exception: dead.append(ws)
    for ws in dead: clients.discard(ws)
def nodes():
    out=[]
    for node_id,r in (getattr(iface,'nodes',{}) or {}).items():
        r=r or {}; u=r.get('user',{}); p=r.get('position',{}); lat=p.get('latitude'); lon=p.get('longitude')
        if lat is None and p.get('latitudeI') is not None: lat=p['latitudeI']*1e-7
        if lon is None and p.get('longitudeI') is not None: lon=p['longitudeI']*1e-7
        out.append({'id':u.get('id') or node_id,'num':r.get('num'),'shortName':u.get('shortName',''),'longName':u.get('longName',''),'lat':lat,'lon':lon,'snr':r.get('snr')})
    return out
def on_rx(packet,interface=None,**kw):
    d=packet.get('decoded',{}); payload=d.get('payload') or (d.get('data',{}) or {}).get('payload')
    if isinstance(payload,bytes) and len(payload)==27: emit({'type':'rx','payloadHex':payload.hex().upper(),'fromId':packet.get('fromId') or packet.get('from'),'toId':packet.get('toId') or packet.get('to'),'rxSnr':packet.get('rxSnr'),'rxRssi':packet.get('rxRssi'),'hopLimit':packet.get('hopLimit'),'hopStart':packet.get('hopStart')})
def on_connected(interface,**kw): emit({'type':'status','status':'CONNECTED','connected':True}); emit({'type':'nodes','nodes':nodes()})
def on_lost(interface=None,**kw): emit({'type':'status','status':'DISCONNECTED','connected':False})
def on_node(node=None,**kw): emit({'type':'nodes','nodes':nodes()})
def send(req):
    cid=str(req.get('clientMessageId') or ''); payload=bytes.fromhex(str(req.get('payloadHex','')).replace(' ','')); dest=req.get('destinationId') or '^all'; want=bool(req.get('wantAck',dest!='^all'))
    if len(payload)!=27: raise ValueError('FWP/1 payload must be exactly 27 bytes')
    holder={}
    def ack(packet): emit({'type':'transport_ack','clientMessageId':cid,'meshPacketId':getattr(holder.get('sent'),'id',None)})
    sent=iface.sendData(payload,destinationId=dest,portNum=int(req.get('portNum',port_num)),wantAck=want,onResponse=ack if want else None,onResponseAckPermitted=True if want else False,channelIndex=int(req.get('channelIndex',0)))
    holder['sent']=sent; emit({'type':'tx_accepted','clientMessageId':cid,'meshPacketId':getattr(sent,'id',None),'destinationId':dest,'wantAck':want})
async def handler(ws):
    clients.add(ws)
    try:
        await ws.send(json.dumps({'type':'status','status':'CONNECTED','connected':True})); await ws.send(json.dumps({'type':'nodes','nodes':nodes()}))
        async for raw in ws:
            req={}
            try:
                req=json.loads(raw); typ=req.get('type')
                if typ=='hello': await ws.send(json.dumps({'type':'hello','bridge':'FIREWATCH','version':'1.3.0','portNum':port_num}))
                elif typ=='get_nodes': await ws.send(json.dumps({'type':'nodes','nodes':nodes()}))
                elif typ=='send': send(req)
                else: await ws.send(json.dumps({'type':'error','error':f'unknown request type: {typ}'}))
            except Exception as e: await ws.send(json.dumps({'type':'error','error':str(e),'clientMessageId':req.get('clientMessageId')}))
    finally: clients.discard(ws)
async def run(args):
    global loop; loop=asyncio.get_running_loop()
    async with websockets.serve(handler,args.ws_host,args.ws_port,max_size=65536):
        print(f'FIREWATCH bridge ws://{args.ws_host}:{args.ws_port} · FWP PortNum {port_num}'); stop=asyncio.Future()
        for sig in (signal.SIGINT,signal.SIGTERM):
            try: loop.add_signal_handler(sig,stop.set_result,None)
            except NotImplementedError: pass
        await stop
def main():
    global iface,port_num
    ap=argparse.ArgumentParser(); g=ap.add_mutually_exclusive_group(); g.add_argument('--serial',nargs='?',const='',metavar='DEVICE'); g.add_argument('--tcp',metavar='HOST'); ap.add_argument('--ws-host',default='127.0.0.1'); ap.add_argument('--ws-port',type=int,default=8765); ap.add_argument('--port-num',type=int,default=256); a=ap.parse_args(); port_num=a.port_num
    if not 256<=port_num<=511: raise SystemExit('PortNum must be 256..511')
    pub.subscribe(on_rx,f'meshtastic.receive.data.{port_num}'); pub.subscribe(on_connected,'meshtastic.connection.established'); pub.subscribe(on_lost,'meshtastic.connection.lost'); pub.subscribe(on_node,'meshtastic.node.updated')
    iface=meshtastic.tcp_interface.TCPInterface(hostname=a.tcp) if a.tcp else meshtastic.serial_interface.SerialInterface(devPath=(a.serial or None) if a.serial is not None else None)
    try: asyncio.run(run(a))
    finally:
        try: iface.close()
        except Exception: pass
if __name__=='__main__': main()

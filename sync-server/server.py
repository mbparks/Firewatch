#!/usr/bin/env python3
"""FIREWATCH reference sync server. Standard-library HTTP + SQLite, no cloud dependency."""
from __future__ import annotations
import argparse, json, sqlite3, threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from pathlib import Path

LOCK=threading.Lock()
DB:sqlite3.Connection

def utc(): return datetime.now(timezone.utc).isoformat()
def init(path:str):
    global DB
    DB=sqlite3.connect(path,check_same_thread=False);DB.row_factory=sqlite3.Row
    DB.executescript('''
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS entities(entity_type TEXT,entity_id TEXT,updated_at TEXT,payload TEXT,origin_station TEXT,PRIMARY KEY(entity_type,entity_id));
    CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY AUTOINCREMENT,entity_type TEXT,entity_id TEXT,updated_at TEXT,payload TEXT,origin_station TEXT,received_at TEXT);
    CREATE TABLE IF NOT EXISTS stations(station_id TEXT PRIMARY KEY,role TEXT,last_seen TEXT);
    ''');DB.commit()

def json_body(h):
    n=int(h.headers.get('content-length','0'));return json.loads(h.rfile.read(n) or b'{}')
class H(BaseHTTPRequestHandler):
    server_version='FIREWATCH-Sync/1.0'
    def log_message(self,fmt,*args): print('[sync]',fmt%args)
    def sendj(self,obj,status=200):
        raw=json.dumps(obj,separators=(',',':')).encode();self.send_response(status);self.send_header('content-type','application/json');self.send_header('access-control-allow-origin','*');self.send_header('access-control-allow-headers','content-type');self.send_header('access-control-allow-methods','GET,POST,OPTIONS');self.send_header('content-length',str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_OPTIONS(self): self.sendj({})
    def do_GET(self):
        u=urlparse(self.path)
        if u.path=='/health':
            with LOCK:
                e=DB.execute('select count(*) c from events').fetchone()['c'];s=DB.execute('select count(*) c from stations').fetchone()['c']
            return self.sendj({'ok':True,'service':'FIREWATCH Sync','version':'1.0.0','events':e,'stations':s,'time':utc()})
        if u.path=='/sync/pull':
            q=parse_qs(u.query);cursor=int(q.get('cursor',['0'])[0]);station=q.get('stationId',[''])[0]
            with LOCK:
                rows=DB.execute('select * from events where seq>? order by seq asc limit 1000',(cursor,)).fetchall()
                top=DB.execute('select coalesce(max(seq),0) m from events').fetchone()['m']
            events=[{'seq':r['seq'],'entityType':r['entity_type'],'entityId':r['entity_id'],'updatedAt':r['updated_at'],'payload':json.loads(r['payload']),'originStationId':r['origin_station']} for r in rows]
            return self.sendj({'events':events,'nextCursor':top,'stationId':station})
        if u.path=='/stations':
            with LOCK: rows=DB.execute('select * from stations order by last_seen desc').fetchall()
            return self.sendj({'stations':[dict(r) for r in rows]})
        return self.sendj({'error':'not found'},404)
    def do_POST(self):
        if urlparse(self.path).path!='/sync/push': return self.sendj({'error':'not found'},404)
        try: body=json_body(self);station=str(body.get('stationId') or '').strip();role=str(body.get('stationRole') or 'LOOKOUT');records=body.get('records') or []
        except Exception as e: return self.sendj({'error':f'invalid json: {e}'},400)
        if not station:return self.sendj({'error':'stationId required'},400)
        accepted=0;ignored=0
        with LOCK:
            DB.execute('insert into stations(station_id,role,last_seen) values(?,?,?) on conflict(station_id) do update set role=excluded.role,last_seen=excluded.last_seen',(station,role,utc()))
            for r in records[:5000]:
                try: et=str(r['entityType']);eid=str(r['entityId']);updated=str(r['updatedAt']);payload=json.dumps(r['payload'],separators=(',',':'),sort_keys=True)
                except Exception: ignored+=1;continue
                old=DB.execute('select updated_at,payload from entities where entity_type=? and entity_id=?',(et,eid)).fetchone()
                # Append only a new logical version. Equal timestamp/equal payload is idempotent; equal timestamp/different payload is retained as an event for client conflict review.
                if old and old['updated_at']==updated and old['payload']==payload: ignored+=1;continue
                if old and old['updated_at']>updated: ignored+=1;continue
                DB.execute('insert into events(entity_type,entity_id,updated_at,payload,origin_station,received_at) values(?,?,?,?,?,?)',(et,eid,updated,payload,station,utc()))
                if not old or updated>=old['updated_at']:
                    DB.execute('insert into entities(entity_type,entity_id,updated_at,payload,origin_station) values(?,?,?,?,?) on conflict(entity_type,entity_id) do update set updated_at=excluded.updated_at,payload=excluded.payload,origin_station=excluded.origin_station',(et,eid,updated,payload,station))
                accepted+=1
            DB.commit()
        self.sendj({'accepted':accepted,'ignored':ignored})

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--host',default='127.0.0.1');ap.add_argument('--port',type=int,default=8790);ap.add_argument('--db',default=str(Path(__file__).with_name('firewatch-sync.sqlite3')));a=ap.parse_args();init(a.db)
    print(f'FIREWATCH Sync 1.0 listening on http://{a.host}:{a.port}  db={a.db}')
    ThreadingHTTPServer((a.host,a.port),H).serve_forever()
if __name__=='__main__':main()

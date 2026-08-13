import { useEffect, useState } from 'react';
import { liveQuery, type Table } from 'dexie';

export function useTable<T, K>(table: Table<T,K>, orderBy?: keyof T & string) {
  const [rows,setRows]=useState<T[]>([]);
  useEffect(()=>{
    const sub = liveQuery(async()=> orderBy ? table.orderBy(orderBy).reverse().toArray() : table.toArray()).subscribe({next:setRows});
    return ()=>sub.unsubscribe();
  },[table,orderBy]);
  return rows;
}

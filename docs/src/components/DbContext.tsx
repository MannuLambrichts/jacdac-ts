import React, { createContext, useState, useEffect, useContext } from "react";
import { FirmwareBlob, parseUF2 } from "../../../src/dom/flashing";
import JacdacContext from "../../../src/react/Context";

export interface Db {
    dependencyId: () => number,
    getFile: (id: string) => Promise<File>;
    putFile: (id: string, file: File) => Promise<void>;
}

function openDbAsync(): Promise<Db> {
    const DB_VERSION = 1
    const DB_NAME = "ASSETS"
    const STORE_FILES = "FILES"
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    let db: IDBDatabase;
    let changeId = 0;

    const api = {
        dependencyId: () => changeId,
        putFile: (id: string, file: File): Promise<void> => {
            changeId++
            return new Promise<void>((resolve, reject) => {
                try {
                    const transaction = db.transaction([STORE_FILES], "readwrite");
                    const blobs = transaction.objectStore(STORE_FILES)
                    const request = file ? blobs.put(file, id) : blobs.delete(id);;
                    request.onsuccess = (event) => resolve()
                    request.onerror = (event) => resolve()
                } catch (e) {
                    console.error(`idb: put ${id} failed`)
                    reject(e)
                }
            })
        },
        getFile: (id: string): Promise<File> => {
            return new Promise<File>((resolve, reject) => {
                try {
                    const transaction = db.transaction([STORE_FILES], "readonly");
                    const blobs = transaction.objectStore(STORE_FILES)
                    const request = blobs.get(id);
                    request.onsuccess = (event) => resolve((event.target as any).result)
                    request.onerror = (event) => resolve((event.target as any).result)
                } catch (e) {
                    console.error(`idb: get ${id} failed`)
                    reject(e)
                }
            })
        }
    }

    return new Promise((resolve, reject) => {
        // create or upgrade database
        request.onsuccess = function (event) {
            db = request.result;
            db.onerror = function (event) {
                console.log("idb error", event);
            };
            resolve(api);
        }
        request.onupgradeneeded = function (event) {
            db = request.result;
            db.createObjectStore(STORE_FILES);
            db.onerror = function (event) {
                console.log("idb error", event);
            };
            resolve(api);
        };
    })
}


export interface DbContextProps {
    db: Db,
    error: any
}

const DbContext = createContext<DbContextProps>({
    db: undefined,
    error: undefined
});
DbContext.displayName = "db";

export default DbContext;

export const DbProvider = ({ children }) => {
    const [db, SetDb] = useState<Db>(undefined)
    const [error, setError] = useState(undefined)
    useEffect(() => {
        openDbAsync()
            .then(d => SetDb(d))
            .catch(e => setError(error))
    }, []);
    return (
        <DbContext.Provider value={{ db, error }}>
            {children}
        </DbContext.Provider>
    )
}

export function useDbFile(fileName: string) {
    const { db } = useContext(DbContext);

    return {
        dependencyId: () => db?.dependencyId(),
        file: () => db?.getFile(fileName) || Promise.resolve(undefined),
        setFile: async (f: File) => { await db?.putFile(fileName, f) }
    }
}

export function useFirmwareBlobs() {
    const { bus } = useContext(JacdacContext)
    const { file, setFile, dependencyId } = useDbFile("firmware.uf2")

    async function load(f: File, store: boolean) {
        if (f) {
            const buf = new Uint8Array(await f.arrayBuffer())
            const bls = parseUF2(buf);
            // success, store and save in bus
            if (store)
                await setFile(f)
            bus.firmwareBlobs = bls
            console.log(`loaded blobs`, bls)
        } else {
            // delete entry
            if (store)
                await setFile(undefined)
            bus.firmwareBlobs = undefined
        }
    }
    useEffect(() => {
        console.log(`import stored uf2`)
        file().then(f => load(f, false))
    }, [dependencyId()])
    return {
        setFirmwareFile: async (f: File) => {
            console.log(`import new uf2`)
            await load(f, true)
        }
    }
}

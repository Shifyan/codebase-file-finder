export namespace scanner {
	
	export class SearchStats {
	    total: number;
	    truncated: boolean;
	    cancelled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new SearchStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.total = source["total"];
	        this.truncated = source["truncated"];
	        this.cancelled = source["cancelled"];
	    }
	}

}

export namespace storage {
	
	export class DiskStats {
	    path: string;
	    totalBytes: number;
	    freeBytes: number;
	    usedBytes: number;
	    usedPercent: number;
	
	    static createFrom(source: any = {}) {
	        return new DiskStats(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.totalBytes = source["totalBytes"];
	        this.freeBytes = source["freeBytes"];
	        this.usedBytes = source["usedBytes"];
	        this.usedPercent = source["usedPercent"];
	    }
	}

}


export namespace scanner {
	
	export class Result {
	    name: string;
	    path: string;
	    size: number;
	    modified: number;
	
	    static createFrom(source: any = {}) {
	        return new Result(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	        this.modified = source["modified"];
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


export class Node {
    private frecuency:number;
    private chars:number;
    private nodeLeft:Node;
    private nodeRight:Node;

    createNode( _pChars:number ):void{
        this.frecuency = 1;
        this.chars = _pChars;
    }

    createNodeExtend( _pFrecuency:number, _pChars:number, _pLeft:Node, _pRight:Node ){
        this.frecuency = _pFrecuency;
        this.chars = _pChars;
        this.nodeLeft = _pLeft;
        this.nodeRight = _pRight;
    }

    getChar():number{
        return this.chars;
    }

    setChar( _pChar:number ):void{
        this.chars = _pChar;
    }

    getFrecuency():number{
        return this.frecuency;
    }

    setFrecuency( _pFrecuency:number ):void{
        this.frecuency = _pFrecuency;
    }

    getNodeLeft():Node{
        return this.nodeLeft;
    }

    setNodeLeft( _pLeft:Node ):void{
        this.nodeLeft = _pLeft;
    }

    getNodeRight():Node{
        return this.nodeRight;
    }

    setNodeRight( _pNodeRight:Node ):void{
        this.nodeRight = _pNodeRight;
    }  
}
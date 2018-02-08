import { Node } from '../../../models/establishment/node';
import { BytesInfo, QRCodeInformation } from '../../../models/establishment/table.model';
import Collections = require('typescript-collections');

export class CodeGenerator {
    
    private stringToConvert:string;
    private diccionary = new Collections.Dictionary<String,Node>();
    private sortList:Array<Node> = new Array<Node>();
    private map = new Collections.Dictionary<String,String>();
    private finalTree:Node = new Node();
    private binaryCode = '';
    private significativeBits:number = 0;
    private finalBytes: BytesInfo[];
    private QRCode:string;

    constructor( _pStringToConvert:string ){
        this.stringToConvert = _pStringToConvert;
        this.finalTree.createNodeExtend( 0, 256, null, null );
        this.finalBytes = [];
    }

    public generateCode(){
        this.buildFrecuencyTable();
        this.sortData();
        this.createTree();
        this.codeTree();
        this.createQRCode();
    }
    
    private buildFrecuencyTable():void{
        let _lNode:Node;
        let _lChars:number = 0;

        for(let _i = 0; _i < this.stringToConvert.length; _i++ ){
            _lChars = this.stringToConvert.charCodeAt( _i );
            _lNode = this.diccionary.getValue( '' + _lChars );

            if( _lNode == null){
                let _lAux:Node = new Node();
                _lAux.createNode(_lChars);
                this.diccionary.setValue( _lChars + '', _lAux );
            } else {
                _lNode.setFrecuency( _lNode.getFrecuency() + 1 );
            }
        }
    }

    private sortData():void{
        let _lNode:Node;
        let _lFrecuency:number;
        let _lSortFrecuency:number[] = [];
        let _lSortTMP:Array<number> = new Array<number>();
        let _AuxCont:number = 0;

        for( let _i = 0; _i <= 255; _i++ ){
            _lSortTMP.splice( 0, 0, 0 );
        }        

        this.diccionary.values().forEach((res)=> {
            _lSortFrecuency.splice( _AuxCont, 0, res.getFrecuency() );
            _lSortTMP.splice( res.getChar(), 1, res.getFrecuency() ); 
            _AuxCont++;
        });

        _lSortFrecuency.sort();

        _lSortFrecuency.forEach((nod)=>{
            let tmp = _lSortTMP.indexOf( nod );
            _lSortTMP.splice( tmp, 1, 0 );
            let tmpNode:Node = new Node();
            tmpNode.createNodeExtend( nod, tmp, null, null );
            this.sortList.push(tmpNode);
        });      
    }

    private createNewNode( _pNodeLeft:Node, _pNodeRight:Node ):Node{
        let _lNewNode:Node = new Node();
        let _lFrecuencyNewNode:number;

        _lFrecuencyNewNode = ( _pNodeLeft.getFrecuency() + _pNodeRight.getFrecuency() );
        _lNewNode.createNodeExtend( 0, 256, null, null );
        _lNewNode.setFrecuency( _lFrecuencyNewNode );
        _lNewNode.setNodeLeft( _pNodeLeft );
        _lNewNode.setNodeRight( _pNodeRight );
        return _lNewNode;
    }

    private insertNewNode( _pNewNode:Node, _pSortList:Array<Node> ):Array<Node>{
        let _lFirstNode:Node = new Node();
        let _lSecondNode:Node = new Node();

        _lFirstNode.createNodeExtend( 0, 256, null, null);
        _lSecondNode.createNodeExtend( 0, 256, null, null );
        _pSortList.splice(0 , 0, _pNewNode );

        for( let _i = 0; _i < _pSortList.length - 1; _i++ ){
            _lFirstNode = _pSortList[ _i ];
            _lSecondNode = _pSortList[ (_i + 1) ];

            if( _lFirstNode.getFrecuency() >= _lSecondNode.getFrecuency() ){
                _pSortList.splice( ( _i + 1 ), 1, _lFirstNode );
                _pSortList.splice( _i, 1, _lSecondNode );
            } 
        }
        return _pSortList;
    }

    private createTree():void {
        let _lTempNodeLeft:Node = new Node();
        let _lTempNodeRight:Node = new Node();
        let _lTempNewNode:Node = new Node();

        _lTempNodeLeft.createNodeExtend( 0, 256, null, null );
        _lTempNodeRight.createNodeExtend( 0, 256, null, null );
        _lTempNewNode.createNodeExtend( 0, 256, null, null );

        while( this.sortList.length != 1 ){            
            _lTempNodeLeft = this.sortList.shift();
            _lTempNodeRight = this.sortList.shift();
            _lTempNewNode = this.createNewNode( _lTempNodeLeft, _lTempNodeRight );
            this.sortList = this.insertNewNode( _lTempNewNode, this.sortList );
        }        
        this.finalTree = this.sortList.shift();
        this.preOrder( this.finalTree, "" );
    }

    private preOrder( _pNode:Node, _pVal:string ):void{
        if( _pNode.getNodeLeft() == null && _pNode.getNodeRight() == null ){
            this.map.setValue( _pNode.getChar() + '', _pVal );
            return;
        }
        this.preOrder( _pNode.getNodeLeft(), _pVal.concat( "1" ) );
        this.preOrder( _pNode.getNodeRight(), _pVal.concat( "0" ) );
    }

    private codeTree():void{
        let _lCodeBytes = '';
        let _lChars = 0;
        let _lEnd:boolean = false;
        let _lByte:number;
        let _lCode:string = '';

        for( let _i = 0; _i < this.stringToConvert.length; _i++ ){
            _lChars = this.stringToConvert.charCodeAt( _i );
            this.binaryCode += this.map.getValue( _lChars + '' );
        }

        _lCode = this.binaryCode;

        while( !_lEnd ){

            let BytesInfo:BytesInfo = { bits:'', finalByte:0, originalByte:0 };

            for( let _j = 0; _j < 8; _j++ ){
                _lCodeBytes += _lCode.charAt( _j );
            }
            _lByte = parseInt( _lCodeBytes, 2 );
            BytesInfo.originalByte = _lByte;

            while( true ){
                _lByte = this.byteNivelator( _lByte );
                if( _lByte >= 65 && _lByte <= 90 ){
                    break;
                }
            }
            BytesInfo.finalByte = _lByte;
            BytesInfo.bits = _lCodeBytes;
            this.finalBytes.push( BytesInfo );
            _lCodeBytes = '';
            _lCode = _lCode.substring( 8, _lCode.length );

            if( _lCode.length == 0 ){
                _lEnd = true;
                break;
            }

            if( _lCode.length < 8 ){
                _lCode = this.addSignificativeBits( _lCode );
            }           
        }
    }

    private addSignificativeBits( _code:string ):string{
        while( _code.length < 8 ){
            _code += "0";
            this.significativeBits += 1;
        }
        return _code;
    }

    private byteNivelator( _pByte:number ):number{
        let _lNumberConvert:number = 0;
        if( _pByte < 65 ){
            _lNumberConvert = _pByte + 10;
        } else if( _pByte > 90 ) {
            _lNumberConvert = _pByte - 10;
        } else {
        _lNumberConvert = _pByte;
        }
        return _lNumberConvert;
    }

    private createQRCode():void{
        let _lQRCode:string = '';

        this.finalBytes.forEach( (byte) => {
            _lQRCode += String.fromCharCode(byte.finalByte)
        });
        _lQRCode += ( this.finalBytes[ 0 ].finalByte + '' );
        _lQRCode += ( this.finalBytes[ this.finalBytes.length - 1 ].finalByte + '' );
        this.QRCode = _lQRCode;
    }

    public getFinalBytes():BytesInfo[]{
        return this.finalBytes;
    }

    public getSignificativeBits():number{
        return this.significativeBits;
    }

    public getQRCode():string{
        return this.QRCode;
    }
}
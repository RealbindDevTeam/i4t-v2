export class OrderMenu {
    public title: string;
    public parent: OrderMenu;

    constructor(private titleOrData: string | {title: string, 
                                               iurestId?: Object, 
                                               children?: OrderMenu[],
                                               queryParams?: Object, 
                                               clickHandler?: Function},
                public iurestId: Object = {},
                public children: OrderMenu[] = [], 
                public queryParams: Object = {}, 
                public clickHandler: Function = null ){
    if( !( typeof titleOrData === 'string' ) ) {
      this.title = titleOrData.title;
      this.iurestId = titleOrData.iurestId || null;
      this.children = titleOrData.children || [];
      this.queryParams = titleOrData.queryParams || {};
      this.clickHandler = titleOrData.clickHandler || null;
    } else {
      this.title = titleOrData;
    }
    for ( let i = 0; i < this.children.length; i++ ) {
      this.children[i].parent = this;
    }
  }
}
export interface IUniversalSearch {
    planId : number;
    id : number;
    model : string;
    icon : string;
    name : string;
    fullName : string;
    matchDistance : number;
    breadcrumbs : IBreadCrumb[];
}

export interface IBreadCrumb {
    id : number;
    nome : string;
    modelo : string; 
}
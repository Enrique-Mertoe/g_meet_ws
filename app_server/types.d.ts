declare interface RequestData {
    event: string;
    action: string;
    target: object;
    apiKey: string;

}

declare interface ResponseData {
    ok: boolean;
    data: object
}

declare type  ApiBuilderType = {
    status: number;
    data: ResponseData
}


declare type ApiReq = Request<ResBody, LocalsObj>
declare type ApiRes = Request<ResBody, LocalsObj>
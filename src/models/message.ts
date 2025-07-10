export interface Message{
    SenderName: string,
    RecieverName: string,
    time: Date,
    message: string,
    type:"onetoone" | "group" ,
}
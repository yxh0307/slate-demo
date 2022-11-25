
export const voidFunction = () => undefined;

const imageReg = /\.(png|jpg|gif|jpeg|webp|apng|svg|unknown|jfif|bmp|dpg)(\?.*)?$/i;
export const isImage = (url: string) => url && imageReg.test(url)
export const createRecorder = (
    stream : MediaStream,
    onData : (blob : Blob) => void,
) => {
    const recorder = new MediaRecorder(stream, {
        mimeType : "audio/webm",
    });

    recorder.ondataavailable = (event) => {
        if(event.data.size > 0 && event.data){
            onData(event.data);
        }
    }

    const start = () => {
        recorder.start(300);// chunk every 300ms
    } 

    const stop = () => {
        if(recorder.state !== "inactive"){
            recorder.stop();
        }
        stream.getTracks().forEach((t) => t.stop());// release mic
    }

    return { start, stop };
};
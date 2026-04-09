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
        recorder.start(1000);// chunk every 1s
    } 

    const stop = () => {
        if(recorder.state !== "inactive"){
            recorder.stop();
        }
        stream.getTracks().forEach((t) => t.stop());// release mic
    }

    return { start, stop };
};
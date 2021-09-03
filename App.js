import React, { useState, useEffect } from "react";
import {
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
} from "react-native-audio-recorder-player";
import RNFetchBlob from "rn-fetch-blob";
import axios from "axios";
var RNFS = require("react-native-fs");

const initialState = {
  isLoggingIn: false,
  recordSecs: 0,
  recordTime: "00:00:00",
  currentPositionSec: 0,
  currentDurationSec: 0,
  playTime: "00:00:00",
  duration: "00:00:00",
};

const audioRecorderPlayer = new AudioRecorderPlayer();

const App = () => {
  const [recordData, setRecordData] = useState(initialState);
  const [record, setRecord] = useState("");

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        console.log("write external stroage", grants);

        if (
          grants["android.permission.WRITE_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants["android.permission.READ_EXTERNAL_STORAGE"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants["android.permission.RECORD_AUDIO"] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log("Permissions granted");
        } else {
          console.log("All required permissions not granted");
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }
  };

  const audioSet = {
    AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
    AudioSourceAndroid: AudioSourceAndroidType.MIC,
    AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
    AVNumberOfChannelsKeyIOS: 2,
    AVFormatIDKeyIOS: AVEncodingOption.aac,
  };
  const meteringEnabled = false;
  const dirs = RNFetchBlob.fs.dirs;
  // console.log("RNFetchBlob:", RNFetchBlob.fs.dirs.CacheDir);
  const path = Platform.select({
    ios: "audio.m4a",
    android: `${dirs.CacheDir}/audio.mp3`,
  });

  const onStartRecord = async () => {
    const result = await audioRecorderPlayer
      .startRecorder
      // path,
      // audioSet,
      // meteringEnabled
      ();
    audioRecorderPlayer.addRecordBackListener((e) => {
      setRecordData({
        recordSecs: e.currentPosition,
        recordTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
      });
      return;
    });
    setRecord(result);
    console.log("result-onStartRecord:", result);
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    // setRecordData({
    //   recordSecs: 0,
    // // });
    // console.log("onStopRecord:", result);
  };

  const onStartPlay = async () => {
    // console.log("onStartPlay");
    // const dirs = RNFetchBlob.fs.dirs;
    // const path = Platform.select({
    //   ios: "audio.m4a",
    //   android: `${dirs.CacheDir}/audio.mp3`,
    // });
    const msg = await audioRecorderPlayer.startPlayer(path);
    console.log("msg-onStartRecord:", msg);
    // setRecord(msg);

    audioRecorderPlayer.addPlayBackListener((e) => {
      // setState({
      //   currentPositionSec: e.currentPosition,
      //   currentDurationSec: e.duration,
      //   playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
      //   duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
      // });
      setRecordData({
        currentPositionSec: e.currentPosition,
        currentDurationSec: e.duration,
        playTime: audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        duration: audioRecorderPlayer.mmssss(Math.floor(e.duration)),
      });
      return;
    });
  };

  const onPausePlay = async (e) => {
    await audioRecorderPlayer.pausePlayer();
  };

  const onStopPlay = async () => {
    // console.log("onStopPlay");
    audioRecorderPlayer.stopPlayer();
    audioRecorderPlayer.removePlayBackListener();
  };

  // RNFS.readDir(RNFS.DocumentDirectoryPath) // On Android, use "RNFS.DocumentDirectoryPath" (MainBundlePath is not defined)
  //   .then((result) => {
  //     console.log("GOT RESULT", result);

  //     // stat the first file
  //     return Promise.all([RNFS.stat(result[0].path), result[0].path]);
  //   })
  //   .then((statResult) => {
  //     if (statResult[0].isFile()) {
  //       // if we have a file, read it
  //       console.log("statResult[1]:", statResult[1]);
  //       return RNFS.readFile(statResult[1], "base64").then((data) => {
  //         // console.log("data:", data);
  //       });
  //     }

  //     return "no file";
  //   })
  //   .then((contents) => {
  //     // log the file contents
  //     // console.log(contents);
  //   })
  //   .catch((err) => {
  //     console.log(err.message, err.code);
  //   });

  const instance = axios.create({
    baseURL: 'https://api.guascafmredsocial.com/api'
  });

  const endPoint = "/messages/audio";

  const sendRecord = async () => {
    let formdata = new FormData();
    formdata.append(
      "audio",
      {
        uri: Platform.OS === "android" ? record : record.replace("file://", ""),
        // uri: record,
        name: "test.mp3",
        type: "audio/mp3",
      },
      record
    );
    formdata.append("system", "1");
    console.log("formdata:", formdata._parts);

    await instance
      .post(endPoint, formdata, {
        headers: {
          Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiMTcyN2UwZTRjOWY3MWI3M2U1ODc1YWQzMGY1NWI3MjdjZThlNmQ5OGM4OWQxNzRkNTRmOWIyMjM1Njc2M2Q3NmQ4YTQ0ZDJlNTZkM2NjYzgiLCJpYXQiOiIxNjMwNjg3NjQyLjU0MDc1NyIsIm5iZiI6IjE2MzA2ODc2NDIuNTQwNzcwIiwiZXhwIjoiMTY2MjIyMzY0Mi4zMTEzMTEiLCJzdWIiOiI0Iiwic2NvcGVzIjpbXX0.n4t8TV3kgpDAh2k3LB_ia89T6lmaWixgNrXLvpc5l3WIh2MDe6rzQmQPxsnFwEUrGkxwKpYmGuxeWktj7G_uHMEQsej2g_w44VxFbrjgbu2pibeSOqkjo8UhI5eCO_-9S6vLqJLuCIpZ-VK7y8ZspK4g2jBPWurysa7Y36Qh_cY9EyuPfKvjzHlSEVbSQiqdUq93uUIJnIm78GagoxrF7Yz7hv7I0melGCC6SakG9uT8DjOPesCcHlMAv1KfySL3J9V7GUOb6sKr7b22kjZHCNil3TYQ0bkTAxh5IUWetPP-_2zYBMYPkHS2pdw6Lh4LN5Csgu-yJn_XJxMZ-G8xbBzYZ4wP0KISMoVOpu_I9buoG_MjZMvgvsVE-V_S8IwE7pUYL6HnqYSTKahyAkJqja2C8V5rKcvEcQ2fDI7gNdJeuLgcGF813pAvlvwhyBXodChWCkQvqqzXpfYCmDjLarZmFcuhaQSmp4ZOphCBt4WUEEJCSAMvUWI9jgM1efoFyXsUVfYvIsnpWdtOm8B-NA2XaewHAVRNDPuDP1LWsXfsKOmwIS-AsVT_srFxqyIKhJSDlJG_ZRelISpnF4AwfnHFrIpsS179UGgN9k-rRkIHK7i171bZNnd42jvo2yRAZCPbzXdy5m7fU9yUQJnoUK8ReOur-ooIlpkgw5OsrRs",
          },
      })
      .then((response) => console.log("response:", response.data))
      // .then((result) => console.log("result:", result))
      .catch((error) => console.log("error", error));
  };

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "white",
        flex: 1,
        justifyContent: "space-around",
      }}
    >
      <Text>InstaPlayer</Text>
      <Text>{recordData.recordTime || "00:00:00"}</Text>
      <TouchableOpacity onPress={() => (requestPermissions(), onStartRecord())}>
        <Text>RECORD</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onStopRecord()}>
        <Text>STOP</Text>
      </TouchableOpacity>
      <Text>
        {recordData.playTime} / {recordData.duration}
      </Text>
      <TouchableOpacity onPress={() => onStartPlay()}>
        <Text>PLAY</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onPausePlay()}>
        <Text>PAUSE</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onStopPlay()}>
        <Text>STOP</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => sendRecord()}>
        <Text>SEND</Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;

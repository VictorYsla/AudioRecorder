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
    // console.log("msg-onStartRecord:", msg);
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

  const instance = axios.create({});

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
            "Bearer eyJhdWQiOiIxIiwianRpIjoiNTkwMTExNTlkN2YxZDJlODE4ZmY0NzdmZDhhNGNmY2ZmNmRjNTQ0NTRmYzY4ODk2ZjM4ZjY0YTY4Y2NmYjM0M2UyNTUyZjkwNDIwNjBmNmIiLCJpYXQiOiIxNjI3Njc3NDY2LjExODExOCIsIm5iZiI6IjE2Mjc2Nzc0NjYuMTE4MTI4IiwiZXhwIjoiMTY1OTIxMzQ2NS45MDMzNTEiLCJzdWIiOiI0Iiwic2NvcGVzIjpbXX0.GBpggX9DQwukhmwiUadtn0OisXLKsmZsquoz-cl5dAHZd21nvU2FX3SH6fXESWeWxxPQWU5NvUrgCs8K7WH2NYJIT7v7Lu0dnUNk9SBzl7GAD2pJURbDqiXQOi3pVbM3R7E-fYZqzqvf5DURzJBpClWhfLdandaQBS3OaIy-w4S12DG6pAjmNzsAMrqG7Gv9WxxyaoxHrP2r9L1T5FtRZHGiia91Jb9AvdwknydoPIO3EQosnXSSkX-AIRXlamRgf6vIjk8yI2ZBedndwxZe1KU6eVeyEWdF7MN6nxnEyRa9027jrSbfTCtEPCAAsQjyazmp24ZU5_nBXknj4mND012dxjdmj2c7j8nPs0vgnu-NlankhreDsdQrn_odZspgB7vNnK2WzQyMKNI3NvgNX8fAICLXifmQL1APk0G89bdnVKLLafqR_RuDq3q5u0-jqvH1CloSmuprWQIZzhQBC5-onhhCrPqwRttgpUSbtfDmBmrdPsdY537Sr6f8Yr5vM-vTUT-6hmDCCdoEVtKWbFBOJs44vt3LoNU3dN5S9I1BpBY5CQox6Hf_mWvotaWhzx4aRuAbqK6mSrbOprsu9V2kmoKH14dpHqLpvN_MhsuLvjMPIMB8Rv06U0JA7hK720HJC_sKY2hAfFcj-QcRjW1EGJ17M4GboJReJD4VeH4",
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

const React = require("react-native");
const { Dimensions } = React;
const deviceHeight = Dimensions.get("window").height;
const deviceWidth = Dimensions.get("window").width;
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';

export default {
    // FULLSCREEN PLAYER
    playerHeader: {
      backgroundColor: "transparent",
      height:0,
      borderBottomWidth: 0,
      marginBottom:hp("5%"),
      marginTop: hp("2%"),
    },
    playerCloseArrowButton: {
      height: hp("4%"),
    },
    playerCloseArrow: {
      height: hp("4%"),
      color: "white",
      fontSize: hp("4%"),
      marginLeft: wp("5%")
    },
    headerBody: {
      height: hp("4%"),
      marginTop: hp("2%"),
    },
    logoContainer: {
      height: hp("4%"),
    },
    logo: {
      fontSize: hp("4%"),
    },
    albumArtContainer: {
      minHeight: 1,
      minWidth: 1,
      height: wp("80%"),
    },
    playerIcons: {
      height: hp("3.5%"),
      color: "#7248BD",
      fontSize: hp("3.5%"),
    },
    controls: {
      flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: wp("70%"),
        marginRight: wp("15%"),
        marginLeft: wp("15%"),
        // marginTop: wp("2%"),
    },

    // MIN PLAYER
    minPlayerContainer : {
      marginBottom: hp("6%"),
    },

    ellipsisContainer: {
      height: hp("5%"),
      width: wp("5%"),
      // flex:1,
      justifyContent: "center",
      // alignItems:"center"
    },
    ellipsis: {
      fontSize: hp("2.5%"),
      color: "white"
    },

};

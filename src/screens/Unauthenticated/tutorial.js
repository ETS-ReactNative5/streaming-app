import React, { Component }  from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { Icon } from 'native-base';
import LinearGradient from 'react-native-linear-gradient';
import AppIntroSlider from 'react-native-app-intro-slider';
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';


import image1 from './../../../assets/page1.png';
import image2 from './../../../assets/page2.png';
import image3 from './../../../assets/page3.png';

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    paddingTop: hp("10%"),
    paddingBottom: hp("5%"),
    alignItems: 'center',
  },
  image: {
    width: wp("75%"),
    height: hp("45%"),
  },
  text: {
    color: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
    textAlign: 'center',
    paddingTop: hp("5%"),
    paddingHorizontal: 20,
    fontSize: hp("3%"),
  },
  title: {
    fontSize: 35,
    color: 'white',
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
});

const slides = [
  {
    key: 'Intro',
    title: 'Welcome!',
    text: 'Revibe lets you stream all your music in one place. You can stream from Revibe, YouTube, and Spotify!',
    note: "",
    image: image1,
    colors: ['#7248BD', '#0E0E0E'],
  },
  {
    key: 'Accounts',
    title: 'Connect Accounts',
    text: 'Login to your accounts and we automatically import your libraries.',
    note: "*Requires premium account.",
    image: image2,
    colors: ['#7248BD', '#0E0E0E'],
  },
  {
    key: 'Features',
    title: 'Search, Queue, Stream',
    text: 'Revibe makes searching, queuing, and streaming easy by giving you one place for all your music. Enjoy!',
    note: "",
    image: image3,

    colors: ['#7248BD', '#0E0E0E'],
  },
];


class Tutorial extends Component {

  constructor(props) {
    super(props);
  }

  _renderItem = ({ item, dimensions }) => (
    <LinearGradient
      style={[
        styles.mainContent,
        dimensions,
      ]}
      colors={item.colors}
      start={{ x: 0, y: 0.1 }}
      end={{ x: 0.1, y: 1 }}
    >
    <Text style={styles.title}>{item.title}</Text>

    <Image source={item.image} style={styles.image} />
        <Text style={styles.text}>{item.text}</Text>
        <Text style={{color: "white", paddingTop: hp("3%")}} note>{item.note}</Text>
    </LinearGradient>
  );

  render() {
    return (
      <AppIntroSlider
        slides={slides}
        renderItem={this._renderItem}
        onDone={() => this.props.navigation.navigate({key: "LinkAccounts", routeName: "LinkAccounts"})}
        doneLabel="Get Started"
        bottomButton />
    );
  }
}


export default Tutorial

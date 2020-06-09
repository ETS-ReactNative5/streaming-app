import React, {Component} from 'react';
import {
  StyleSheet,
  KeyboardAvoidingView,
  View,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Linking
} from 'react-native';
import { Text, CheckBox, Icon } from "native-base";
import PropTypes from 'prop-types';
import Modal from "react-native-modal";
import {widthPercentageToDP as wp, heightPercentageToDP as hp} from 'react-native-responsive-screen';
import { connect } from 'react-redux';

import Logo from './../../components/Logo';
import ButtonSubmit from './../../components/ButtonSubmit';
import UserInput from './../../components/UserInput';
import ForgotPassword from "./forgotPassword";
import AccountSync from "./../../components/accountSync/index";
import LoginOffline from "./../../components/offlineNotice/loginOffline";
import RevibeAPI from './../../api/revibe'
import YouTubeAPI from './../../api/youtube'

import { getPlatform } from './../../api/utils';
import { logEvent, setRegistration, setUserData } from './../../amplitude/amplitude';
import { initializePlatforms } from './../../redux/platform/actions'


class LoginScreen extends Component {

    constructor(props) {
      super(props);
      this.state = {
        press: false,
        registering: this.props.navigation.state.params.registering,
        resettingPassword: false,
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
        newPassword1: "",
        newPassword2: "",
        agreedToTermsAndConditions: false,
        showTermsAndConditionsWarning: false,
        syncing: false,
        loading: false,
        success: false,
        showForgotPasswordModal: false,
        error: {},
      };

      this.revibe = new RevibeAPI()
      this.youtube = new YouTubeAPI()
      this.toggleForgotPasswordModal = this.toggleForgotPasswordModal.bind(this);
      this._login = this._login.bind(this);
      this._register = this._register.bind(this);
      this.submitButtonPressed = this.submitButtonPressed.bind(this);
      this.fetchConnectedAccounts = this.fetchConnectedAccounts.bind(this);
      this.syncAccounts = this.syncAccounts.bind(this);
      this.displayError = this.displayError.bind(this);
    }

    async fetchConnectedAccounts() {
      var connectedPlatforms = await this.revibe.fetchConnectedPlatforms()
      for(var x=0; x<connectedPlatforms.length; x++) {
        let platform = getPlatform(connectedPlatforms[x].platform)
        platform.saveToken(connectedPlatforms[x])
      }
      this.setState({ syncing: true})
    }

    async syncAccounts() {
      // need to pull all data from accounts that were signed into
      var platformsFetching = []
      var platformNames = Object.keys(this.props.platforms)
      for(var x=0; x<platformNames.length; x++) {
        platformsFetching.push(this.props.platforms[platformNames[x]].fetchLibrarySongs())
      }
      platformsFetching.push(this.revibe.fetchAllPlaylistsSongs())
      await Promise.all(platformsFetching)
      this.setState({syncing:false})
      this.props.navigation.navigate("Authenticated")
    }

    async submitButtonPressed() {
      if(this.state.registering) {
        logEvent("Registration", "Submitted")
        await this._register()
      }
      else {
        logEvent("Login", "Submitted")
        await this._login()
      }
    }

    async _login() {
      try {
        this.setState({loading: true})
        var response = await this.revibe.login(this.state.username, this.state.password);
        if(this.state.resettingPassword) {
          if(this.state.newPassword1 !== this.state.newPassword2) {
            this.setState({error: {passwords: "Passwords do not match"}, loading: false})
          }
          else {
            var changePasswordResponse = await this.revibe.changePassword(this.state.password,this.state.newPassword1,this.state.newPassword2);
            // this.setState({ firstName: changePasswordResponse.first_name, success: true })
            this.setState({success: true })
            await this.youtube.login()
            await this.fetchConnectedAccounts()
            await this.props.initializePlatforms()
            this.setState({syncing: true})
            setTimeout(this.syncAccounts, 5000)
            logEvent("Login", "Success")
            setUserData()
          }
        }
        else if(response.force_change_password) {
          this.setState({resettingPassword: true, loading: false})
        }
        else if(response.hasOwnProperty("first_name")) {
          this.setState({ firstName: response.first_name, success: true })
          await this.youtube.login()
          await this.fetchConnectedAccounts()
          await this.props.initializePlatforms()
          this.setState({syncing: true})
          setTimeout(this.syncAccounts, 5000)
          logEvent("Login", "Success")
          setUserData()
        }
        else {
          this.setState({error: response})
          this.setState({loading: false})
          logEvent("Login", "Failed")
        }
      }
      catch(error) {
        console.log(error);
      }
    }

    async _register() {
        try {
          if(this.state.agreedToTermsAndConditions) {
            this.setState({loading: true})
            var response = await this.revibe.register(this.state.username, this.state.password)
            if(response.access_token) {
              this.setState({ success: true })
              await this.youtube.login()
              this.props.initializePlatforms()
              logEvent("Registration", "Success")
              setRegistration()
              this.props.navigation.navigate(
                {
                  key: "LinkAccounts",
                  routeName: "LinkAccounts",
                }
              )
            }
            else {
              console.log(response);
              this.setState({error: response})
              this.setState({loading: false})
              logEvent("Registration", "Failed")
            }
          }
          else {
            this.setState({showTermsAndConditionsWarning: true})
          }

        }
        catch(error) {
          console.log(error);
        }
    }

    async _googleSignInPressed() {
      /// Need to check whether a user is logging in or registering in order to direct them to the link accounts page or just log them in
      var response = await this.revibe.signinWithGoogle();
      // console.log(response);
      if(response.access_token) {
        this.setState({ success: true })
        await this.youtube.login()
        this.props.initializePlatforms()
        // logEvent("Registration", "Success")
        this.props.navigation.navigate(
          {
            key: "Tutorial",
            routeName: "Tutorial",
          }
        )
      }
      else {
        this.setState({error: response})
        this.setState({loading: false})
        // logEvent("Registration", "Failed")
      }
    }

    toggleForgotPasswordModal() {
      this.setState({ forgotPasswordModal: !this.state.forgotPasswordModal });
    }

    displayError() {
      var errorKey = Object.keys(this.state.error)[0]
      var error = this.state.error[errorKey]

      // if(errorKey === "profile") {
      //   var errorKey2 = Object.keys(error[errorKey])[0]
      //   error = error[errorKey2]
      // }
      if(Array.isArray(error)) {
        error = error[0]
      }
      if(error.includes("This field")) {
        error = error.replace("This field",errorKey.replace("_", " "))
      }
      if(error.substr(error.length - 1) === "'") {
        error = error.slice(0, -1)
      }
      // console.log(error);
      return error.charAt(0).toUpperCase() + error.slice(1)
    }



  render() {
    return (
      <>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{flex: 1, backgroundColor:'#0E0E0E', alignItems: "center", justifyContent: "center"}}>
        <Logo />
        <Text style={[styles.title, {marginTop: hp(7), marginBottom: hp(2), marginLeft: wp(8), alignSelf: "flex-start"}]}>{this.state.resettingPassword ? "Reset Password" : this.state.registering ? "Sign up" : "Sign in"}</Text>
        <KeyboardAvoidingView behavior="padding" style={styles.container}>
          {Object.keys(this.state.error).length > 0 ?
            (<Text style={styles.authenticationError}>
              {this.displayError()}
            </Text>) : null }

          {this.state.resettingPassword ?
            (<View style={styles.titleContainer}>
              <Text style={styles.title}>Reset Password</Text>
            </View>) : null}

          <View style={{marginBottom: hp(10), alignItems: "center"}}>
          {this.state.resettingPassword ?
            <>
            <UserInput
              icon="lock"
              secureTextEntry={true}
              placeholder="Password"
              returnKeyType={'done'}
              autoCapitalize={'none'}
              autoCorrect={false}
              width={wp("85%")}
              height={hp(7)}
              onChange={(text) => this.setState({newPassword1: text})}
            />
            <UserInput
              icon="lock"
              secureTextEntry={true}
              placeholder="Confirm Password"
              returnKeyType={'done'}
              autoCapitalize={'none'}
              autoCorrect={false}
              width={wp("85%")}
              height={hp(7)}
              onChange={(text) => this.setState({newPassword2: text})}
            />
            </>
          :
            <>
            <UserInput
              icon="user"
              placeholder="Username"
              autoCapitalize={'none'}
              returnKeyType={'done'}
              autoCorrect={false}
              width={wp("85%")}
              height={hp(7)}
              onChange={(text) => this.setState({username: text})}
            />
            <UserInput
              icon="lock"
              secureTextEntry={true}
              placeholder="Password"
              returnKeyType={'done'}
              autoCapitalize={'none'}
              autoCorrect={false}
              width={wp("85%")}
              height={hp(7)}
              onChange={(text) => this.setState({password: text})}
            />
            {this.state.registering ?
              <>
              <View style={{width: wp(90), alignItems: "center", justifyContent: "flex-start", flexDirection: "row", minHeight: hp(3)}}>
                <CheckBox
                  checked={this.state.agreedToTermsAndConditions}
                  color="#7248BD"
                  style={{marginRight: wp(5)}}
                  onPress={() => this.setState({agreedToTermsAndConditions: !this.state.agreedToTermsAndConditions, showTermsAndConditionsWarning: false})}
                />
                <Text style={[styles.text, {fontSize: hp(1.2)}]}>I agree to the </Text>
                <Text style={[styles.text, {fontSize: hp(1.2), color: "#7248BD"}]} onPress={() => Linking.openURL('https://revibe-media.s3.us-east-2.amazonaws.com/Terms+and+Conditions.pdf')}>Terms and Conditions </Text>
              </View>
              {this.state.showTermsAndConditionsWarning ?
                <Text style={{fontSize: hp(1.5), color: "red", alignSelf: "flex-start", marginLeft: wp(10), marginTop: hp(2)}}>Please agree to the Terms and Conditions</Text>
              :
                null
              }
              </>
            :
              <View style={{width: wp(85), alignItems: "center", justifyContent: "flex-start", flexDirection: "row", minHeight: hp(3)}}>
                <TouchableOpacity
                  onPress={() => this.setState({showForgotPasswordModal: !this.state.showForgotPasswordModal})}
                >
                <Text style={[styles.text, {fontSize: hp(1.2)}]}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
            }
            </>
          }
        </View>
        <View style={{alignItems: "center", justifyContent: "space-between", height: hp(30)}}>
          <ButtonSubmit
            text={this.state.registering ? "Sign up" : "Sign in"}
            width={wp(75)}
            height={hp(5)}
            onPress={this.submitButtonPressed}
            loading={this.state.loading}
            success={this.state.success}
          />

        <Text style={[styles.text, {fontSize: hp(1.3)}]}>or</Text>
        <TouchableOpacity
          onPress={() => this._googleSignInPressed()}
        >
          <View style={{width: wp(18), height: wp(18), borderRadius: wp(10), backgroundColor: "#7248BD", alignItems: "center", justifyContent: "center"}}>
            <Icon type="AntDesign" name="google" style={{fontSize: wp(8), paddingTop: wp(1), color: "white"}} />
          </View>
        </TouchableOpacity>

          <View style={styles.bottomTextContainer}>
            <TouchableOpacity
              onPress={() => this.setState({registering: !this.state.registering})}
            >
              <Text style={[styles.text, {fontWeight: 'bold'}]}>{this.state.registering ? "Sign in" : "Sign up"}</Text>
            </TouchableOpacity>
            {/*<TouchableOpacity
              onPress={() => console.log("Skipping")}
            >
              <Text style={[styles.text, {fontWeight: 'bold'}]}>Skip</Text>
            </TouchableOpacity>*/}
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal
      isVisible={this.state.syncing}
      animationIn="fadeIn"
      backdropOpacity={1}
      >
        <View style={styles.accountSyncContainer} >
          <AccountSync
          welcomeText={"Welcome Back " + this.state.firstName}
          syncText="Syncing with your accounts... "
          />
        </View>
      </Modal>

      <Modal
      isVisible={this.state.showForgotPasswordModal}
      backdropOpacity={1}
      style={{ margin: 0 }}
      >
        <ForgotPassword onClose={() => this.setState({showForgotPasswordModal: !this.state.showForgotPasswordModal})}/>
      </Modal>
      </>
    );
  }
}

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },

  bottomTextContainer: {
    // flex: 1,
    width: DEVICE_WIDTH,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  titleContainer: {
    flex: .2,
    marginTop: hp("1%"),
    alignItems: 'center',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    backgroundColor: 'transparent',
    fontSize: hp("3.5%"),
  },
  text: {
    color: 'white',
    backgroundColor: 'transparent',
  },
  authenticationError: {
    position:"absolute",
    bottom: hp("35%"),
    fontWeight: "bold",
    textAlign: "center",
    color:"red",
    fontSize: hp("2%"),
  },
  accountSyncContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

function mapStateToProps(state) {
  return {
    connected: state.connectionState.connected,
    platforms: state.platformState.platforms,
  }
};

const mapDispatchToProps = dispatch => ({
    initializePlatforms: () => dispatch(initializePlatforms()),
});

export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen)

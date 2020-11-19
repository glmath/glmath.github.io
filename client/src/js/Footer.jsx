import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component, useState } from "react";
import { Button, Modal, Spinner, Alert } from "react-bootstrap";
import {
    Link
} from "react-router-dom";





class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }


    render() {



        return (
            <div className="footer-wrapper">
                <div className="footer-right-align">
                    {/* <span className="footer-text">Math Content by Pinetree Mathematics Department Head: Mr.G Lin </span> */}
                    <span className="footer-text">
                        {this.props.isAdmin ?
                            <Button variant="dark" className=" btn-xs admin-login-button" onClick={() => this.props.logoutButton()}> Logout </Button> :
                            <div>
                                <Button variant="dark" className=" btn-xs admin-login-button" onClick={() => this.props.loginButton()} > Admin Login </Button>
                                <div>
                                    App by <a href="https://shahan.ca" target="_blank">Shahan Neda</a>
                                </div>
                            </div>
                        }
                    </span>
                </div>
            </div>
        );
    }



}







export default Footer;

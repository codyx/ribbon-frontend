import {
  BankOutlined,
  BlockOutlined,
  GithubOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import { Button, Col, Layout, Row } from "antd";
import React from "react";
import { useRouteMatch } from "react-router-dom";
import styled from "styled-components";
import { PrimaryMedium, PrimaryText, SecondaryText } from "../designSystem";
import EmailCaptureForm from "./EmailCaptureForm";

const { Footer: AntFooter } = Layout;

const EducationalContainer = styled.div`
  display: flex;
  width: 100%;
  padding: 100px 25%;
  background-color: rgba(0, 0, 0, 0.01);
`;

const EducationalTitle = styled(PrimaryMedium)`
  font-size: 32px;
  line-height: 40px;
`;

const EducationSubtitle = styled(PrimaryText)`
  font-style: normal;
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
`;

const LearnMoreButton = styled(Button)`
  font-family: "Montserrat";
  width: 160px;
  height: 48px;
  border-radius: 8px;
`;

const EmailCaptureContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 64px 0;
  background-color: #000000;
`;

const EmailCaptureTitle = styled(SecondaryText)`
  margin-bottom: 16px;
  font-family: Montserrat;
  font-style: normal;
  font-weight: 500;
  font-size: 22px;
  line-height: 28px;
`;

const EmailCaptureSubtitle = styled(SecondaryText)`
  font-family: Montserrat;
  font-style: normal;
  font-weight: normal;
  font-size: 16px;
  line-height: 24px;
  text-align: center;
  margin-bottom: 24px;
  color: rgba(255, 255, 255, 0.8);
`;

const EmailCaptureIcon = styled(BlockOutlined)`
  margin-bottom: 24px;
  font-size: 50px;
  color: #f9457a;
`;

const FooterLinks = styled(Row)`
  background-color: #000000;
  padding: 40px 15%;
`;

const NavAnchor = styled.a`
  color: rgba(255, 255, 255, 0.9);
  font-family: Montserrat;
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 24px;
  margin: 0 20px;

  &:hover {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const FooterLeft = styled(Col)`
  display: flex;
  align-items: center;
`;

const FooterRight = styled(Col)`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const iconStyles = {
  color: "white",
  fontSize: 30,
  marginLeft: 12,
  marginRight: 12,
};

const Footer = () => {
  const matchHome = useRouteMatch({
    path: "/",
    exact: true,
  });
  const matchProduct = useRouteMatch({
    path: "/product",
  });

  return (
    <AntFooter
      style={{
        backgroundColor: "inherit",
        marginTop: 60,
        paddingBottom: 0,
      }}
    >
      <EmailCaptureContainer>
        <EmailCaptureIcon></EmailCaptureIcon>

        <EmailCaptureTitle>Lorem Ipsum dolor</EmailCaptureTitle>
        <EmailCaptureSubtitle>
          Lorem ipsum dolor sit amet consectetur adipiscing elit, sed do
        </EmailCaptureSubtitle>

        <EmailCaptureForm theme="dark"></EmailCaptureForm>
      </EmailCaptureContainer>
      <FooterLinks>
        <FooterLeft span="12">
          <NavAnchor href="/faq">FAQs</NavAnchor>
          <NavAnchor href="/company">Company</NavAnchor>
          <NavAnchor href="https://medium.com/@ribbonfinance">Blog</NavAnchor>
        </FooterLeft>
        <FooterRight span="12">
          <a href="https://twitter.com/RibbonFinance">
            <TwitterOutlined style={iconStyles} />
          </a>
          <a href="https://discord.gg/85gcVafPyN">
            <i style={iconStyles} className="fab fa-discord"></i>
          </a>
          <a href="https://github.com/ribbon-finance">
            <GithubOutlined style={iconStyles} />
          </a>
        </FooterRight>
      </FooterLinks>
    </AntFooter>
  );
};
export default Footer;

import React, {useState, useRef} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import '@aws-amplify/ui-react/styles.css';

import {
    SideNavigation,
} from "@cloudscape-design/components";

export default function ServiceNavigation(props){
	const location = useLocation();
	let navigate = useNavigate();

	function onFollowHandler(event) {
			if (!event.detail.external) {
					event.preventDefault();
					navigate(event.detail.href);
			}
	}

	return (
			<SideNavigation
					activeHref={location.pathname}
					header={{href: "/", text: "LieSense Image Verification"}}
					onFollow={onFollowHandler}
					items={[
							// {type: "link", text: "Upload", href: "/"},
							// {type: "divider"},
							{
									// type: "link",
									// text: "About LieSense Checker",
									// href: "https://workshops.aws",
									type: "link",
									text: "Required Disclaimer",
									href: "https://www.lawyer.com",
					
									external: true
							}
							
					 
							
					]}
			/>
	);
}
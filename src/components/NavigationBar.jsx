import { useNavigate } from "react-router-dom";

import {
	TopNavigation
} from "@cloudscape-design/components";

export default function NavigationBar({ user }) {
	const navigate = useNavigate();
	const navbarItemClick = (e)=>{
		console.log(e);
		if(e.detail.id === 'profile') navigate("/account/me", {replace: true});
		else if(e.detail.id === 'signout') navigate("/account/logout", {replace: true});
	}
	return (
		<>
			<div id="navbar" style={{fontSize: 'body-l !important', position: 'sticky', top: 0, zIndex: 1002}}>
				<TopNavigation
						identity={{
							href: "#",
							title: "LieSense Checker",
						}}
						utilities={[
							{
								type: "menu-dropdown",
								text: user?.username,
								description: user?.username,
								iconName: "user-profile",
								onItemClick: navbarItemClick,
								items: [
									{id: "profile", text: "Profile"},
									{id: "signout", text: "Sign out"}
								]
							}
						]}
						i18nStrings={{
								searchIconAriaLabel: "Search",
								searchDismissIconAriaLabel: "Close search",
								overflowMenuTriggerText: "More"
						}}
					/>
			</div>
		</>
	);
}

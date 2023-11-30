import { Outlet } from "react-router-dom";

export default function PageUserBase() {
	return (
		<div style={{width:"400px", maxWidth:"calc(100% - 40px)", margin:"auto", marginTop:"50px"}}>
			<Outlet />
		</div>
	);
}
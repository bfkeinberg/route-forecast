import faq from "../../static/faq.htm"
import React, {useState} from "react"
import Typography from "@mui/material/Typography"
import cookie from 'react-cookies';
import  {useMediaQuery} from 'react-responsive'
import { Drawer } from "@mantine/core";

const FaqImage = ({flash} : {flash:boolean}) => {
    const textClass = flash ? "flashing-red-text" : ""
    const width = 50;
    const height = 30;
    const viewBox = `0 0 ${width} ${height}`
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBox}>
            <text fill="none"  strokeWidth={1} paintOrder="stroke" y={20} stroke="#0066ff"
             fontFamily="sans-serif" fontSize={18} fontWeight="bold" className={textClass}>FAQ</text>
        </svg>
    )
}

export const ShowFaq = () => (<Typography style={{ overflowY: 'scroll' }} dangerouslySetInnerHTML={{ __html: faq }} />)

const FaqButton = () => {
    const [faqVisible, setFaqVisible] = useState(false)
    const showFaq = () => {
        cookie.save('clickedFaq', "true", { path: '/' }); 
        setFaqVisible(true)
    }

    const hideFaq = () => {
        setFaqVisible(false)
    }
    const faqWasClicked = cookie.load('clickedFaq')
    const isMobile = useMediaQuery({query:'(max-width: 600px)'})
    const drawerSize = isMobile? "sm" : "xl"

    return (
        <>
            <button style={{border:'none', backgroundColor: 'transparent', width:"90px", height:"60px"}} onClick={showFaq}>
                <FaqImage flash={!faqWasClicked}/>
            </button>
            <Drawer style={{overflowY: 'scroll'}} size={drawerSize} onClose={hideFaq} position={"right"} title={"Randoplan FAQ"} opened={faqVisible}>
                <Typography dangerouslySetInnerHTML={{__html:faq}}/>
            </Drawer>
        </>
    )
}

export default React.memo(FaqButton)
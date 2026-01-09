import faq from "../../static/faq.htm"
import Typography from "@mui/material/Typography"
import { Drawer } from "@mantine/core";

export const ShowFaq = () => (<Typography style={{ overflowY: 'scroll' }} dangerouslySetInnerHTML={{ __html: faq }} />)

interface FaqDrawerProps {
    drawerSize:string, 
    hideFaq:()=>void, 
    faqVisible:(boolean)
}
export const FaqDrawer = ({drawerSize, hideFaq, faqVisible} : FaqDrawerProps) => (<Drawer style={{ overflowY: 'scroll' }} size={drawerSize} onClose={hideFaq} position={"right"} title={"Randoplan FAQ"} opened={faqVisible}>
    <Typography dangerouslySetInnerHTML={{ __html: faq }} />
</Drawer>
)
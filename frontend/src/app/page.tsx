import Image from "next/image";

import { Button, createTheme, ThemeProvider } from "flowbite-react";

const customTheme = createTheme({
  button: {
    color: {
      primary: "bg-red-500 hover:bg-red-600",
      secondary: "bg-blue-500 hover:bg-blue-600",
    },
    size: {
      lg: "px-6 py-3 text-lg",
    },
  },
});

export default function Home() {
  return <>
    <h1>Hola</h1>
    <Button className="bg-red-500 hover:bg-red-600">Custom Button</Button>
    <br /><br />
       
        <ThemeProvider theme={customTheme}>

      <Button color="primary">Red Button</Button>
      <Button color="secondary" size="lg">
        Large Blue Button
      </Button>
    </ThemeProvider>
  </>
}

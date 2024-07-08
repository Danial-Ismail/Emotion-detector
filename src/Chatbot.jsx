import React, { useEffect, useState } from 'react'
import RoboImg from "./images/medicalrobo.jpg"
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from "@chatscope/chat-ui-kit-react";
import API_KEY from './config';
import axios from "axios"
import Webcam from "react-webcam"
import { IoCameraOutline, IoCloseOutline } from "react-icons/io5";


const Chatbot = () => {
    const [data, setData] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [webcamActive, setWebcamActive] = useState(false);
    const [fullScreenMode, setFullScreenMode] = useState(false)
    const webcamRef = React.useRef(null)



    const displayInitialMessage = (text) => {
        let initialMessage = [
            {
                message: text,
                sentTime: "just now",
                sender: "system",
                direction: "incoming",
                position: "single",
            },
        ]

        setData(initialMessage);
    }

    useEffect(() => {
        displayInitialMessage("Hello! How Can I Help You?")
    }, [])

    const captureImage = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImageFile(imageSrc)
        setWebcamActive(false)
        setFullScreenMode(false)

        let imageMessage = {
            message: imageSrc, // Store the image URL in the message field
            sentTime: "just now",
            sender: "user",
            direction: "outgoing",
            position: "single",
            isImage: true, // Flag to indicate this message contains an image
        };
        setData(prev => [...prev, imageMessage]);
    }




    const myChat = async (text) => {
        const url = "https://api.openai.com/v1/chat/completions"
        const config = {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
        console.log(API_KEY)
        let imageUrl = null;
        if (imageFile) {
            try {
                const blob = await fetch(imageFile).then((res) => res.blob());
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                imageUrl = await new Promise((resolve, reject) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                });
            } catch (error) {
                console.error("Error fetching or processing image:", error);
                return;
            }
        }


        const data = {
            "model": "gpt-4-vision-preview",
            "messages": [
                {
                    "role": "system",
                    "content": "I'm going to share a picture with you. Determine the emotions that you can associate with the image. Please refrain from using pre-defined emotion labels and focus solely on assessing the intensity of emotions portrayed in the image. Provide your analysis based on your perception of the emotions conveyed.Additionally, assign values on a scale to represent the intensity of each emotion "
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": imageUrl,
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 300
        }
        setIsLoading(true)
        await axios?.post(url, data, config).then((res) => {
            let result = res.data.choices[0]['message']['content']
            console.log("result", result)

            let my_value = [
                {
                    message: result,
                    sentTime: "just now",
                    sender: "system",
                    direction: "incoming",
                    position: "single"
                }
            ]
            setData(prev => [...prev, ...my_value])
            setIsLoading(false)
        })
    }

    const toggleFullScreenMode = () => {
        setFullScreenMode(prevState => !prevState)
    }

    const onClickCamera = () => {
        setWebcamActive(true)
        toggleFullScreenMode();
    }

    const onClickClose = () => {
        setWebcamActive(false)
        setFullScreenMode(false)
    }

    const onclick = (text) => {
        let my_value = [
            {
                message: text,
                sentTime: "just now",
                sender: "user",
                direction: "outgoing",
                position: "single",
            },
        ]
        setData(prev => [...prev, ...my_value])
        myChat(text)
    }



    return (
        <div className='flex flex-col sm:flex-row'>
            <div className='sm:w-1/2 lg:w-[50%] bg-cover lg:h-screen bg-center'>
                <img src={RoboImg} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className='lg:w-[50%] sm:w-1/2 flex flex-col lg:h-screen'>
                <div className='bg-blue-500 text-white p-4 items-center justify-center'>
                    <h1 className='font-bold text-lg'>Psybotic Therapist</h1>
                    <div style={{ position: "relative", height: "570px" }}>
                        <MainContainer>
                            <ChatContainer>
                                <MessageList typingIndicator={isLoading ? <TypingIndicator content="Ai is typing..." /> : null}>
                                    {data.map((message, index) => (
                                        <Message
                                            key={index}
                                            model={{
                                                message: message.isImage ? `<img src="${message.message}" alt="Captured" style="max-width: 100%;" />` : message?.message,
                                                sentTime: message?.sentTime,
                                                sender: message?.sender,
                                                direction: message?.direction,
                                            }}
                                        />
                                    ))}
                                </MessageList>
                                <div as="MessageInput" className={` ${window.innerWidth < 640 ? "flex flex-col items-center" : "flex sm:flex-row sm:h-auto"}`}>
                                    <MessageInput placeholder='Type your message here...' onSend={onclick} attachButton={false} className='sm:w-[600px] w-full' />
                                    {webcamActive ?
                                        <IoCloseOutline size={32} color='#ff0000' className='cursor-pointer' onClick={onClickClose} /> :
                                        <IoCameraOutline size={32} color='#6faaf9' className={`cursor-pointer ${window.innerWidth < 640 ? "flex flex-col" : "flex sm:flex-row sm:h-auto"}`} onClick={onClickCamera} />
                                    }
                                </div>
                            </ChatContainer>
                        </MainContainer>
                        {webcamActive && (
                            <div className={fullScreenMode ? 'fixed inset-0 z-50 overflow-hidden bg-black' : ''}>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat='image/jpeg'
                                    height={fullScreenMode || window.innerWidth < 640 ? window.innerHeight : 512}
                                    width={fullScreenMode || window.innerWidth < 640 ? window.innerWidth : 512}
                                />
                                <button onClick={captureImage} className="absolute bottom-[-35px] left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white w-20 h-20 flex justify-center items-center">Capture</button>
                                <IoCloseOutline size={32} color='#ff0000' className='cursor-pointer absolute top-4 right-4' onClick={onClickClose} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chatbot
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, WidthType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import './AdminPages.css';
import './responsive.css';

const BRASAO_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCACoASwDASIAAhEBAxEB/8QAHAABAAMBAQEBAQAAAAAAAAAAAAUGBwQIAwIB/8QATxAAAAQEAwQHBAUHCQYHAAAAAQIDBAAFERIGEyEUIjFBBxUjMkJRYVJicYEkM3KCkRYlNENToaIIRGOSssHR8PEmNXOxwuE2ZHSDk7Pi/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/APZcIQgEIQgEIQgEIQgEIQgEIQgEIQgEIQgEIRFOp1L2kx2BwtlnsAwnP3C1raAj5jQf8iEBKwhHFMX7WXogo5UIS/6sniUNxoAcxgO2EczB0m8Zoukq5ahbg/7x0wCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIjBnkk5zdj4v50TlqPPlAdq6iSSJ1VBsIQtxvshFUZ4wEAJtrKpFLu0RHj5FAB4jWocfIecdGKZ2x6oO2avkTqOAs7FQhrS8xNroXQQrw1jPGc1ZPJk+YNXWY4aW55CXbhhruCPmNg6d6oAW0IDSZhiiXJy5RVqte4HcRJYP1ggNtfSsUcyvbLqq9opftCn/ABBNSnw3xjH+kLpDfdZKSvDznZ00z2KOSW3HLcJDAQf1ZAH2d43e7sWLozxDN54zUSfMU0026SbdA+9mOHFvER5VECHNpu3BAaK1nThNqg2VmeQntBcg6hzGucH1TSDXUoUEbPUnlbHzWmDl48UVdZijjNMrZmfVFDvJh5cKfxRmWKnP5UdITHC7Z8om3aHUSzibt7q0RMp8LwDT03eMWxk6UnEnXf8AUfWc9yjSxdsde0rd4SoFU8i1EQG+oUoFpqwFzwlNglrvJWV+hOD9/wDpBoAa+n+eEWN9iuXI1BuCjo9prLd0omAaUqPPn8IwscXsmaK/5QyO+ayxL6dJnS5Ut7S1dIQAQGgX22hwNcXgAjZpWuonIU5oqko4l26Rd7n5u9dQwDXfFMBGhVNTW73dCohp+Hp91m8WbKETIOWVVMhRExrR41/Eg8u96RYow3CuPpajKxxYrtezIK2OkU0ymWLeYCUEK+ZyH3R8ue6OtpYgkKqCblKcy86Z0s0imeWgpjTe48NS/iEBLwjlaPmTu8GzpBezQ+WoBrfjHVAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQjkePmbNLNdOE0A5Xn73w84DrjJFlO2+t+wfu/6Br92u7uiEXB9jBsQB2Jqsvu1vP2Yd6lKd/wDdxEC8a2+fMcdJblnPnbWTpIKJtyKInWPvdtpv18YAI09+p/DSgWLpSn6sjw2plZjdw4VKleTdMkW0RMcPIaBQo+GtxaUMEYrK5xMpGiulJ3KjRRwRMh7LczcLuUHwCN/h8vtRHzzEOIJgtsEzVfPGX1xCHTuUJXUwgPGleRh93SJHqiduFsrqx9mKeDIMXe8z0ARHj5AXX7MB/MPyabzhbKYscxSwpz+yQw1oNRoHnz5BuxpUjaPej/B7uaOpmupMXFzdi2zOzSUHvqBpqIBpWhdRtj79F8lncvZ7A5VTTUeKlOgTLLcka3fOcQ04cte6T4BF4uNMsYYkysPMXbuVSwmztTkT7PTvHE/Cojr/AFIDi6Ky/wC3km/4pv7B41XESaeH8YITTtE5VO7Wj45FLcpwH1KwCHAeVeVLu9FCwTh6ZSfFTGaTNWWt026pjnJ1khmd0Q4Af1jVpx1biSQu5Wr2ibhKy8lq9huJT7gjwGg/KAy7pCw4xOzXUfJrt5q3mn02cptF3JlSiluIW61EezHtBrpdpdQK/I5vN5POGKU46yTkTc9h89NdJM9SkIQbB0ESWAPC73h3aaJLZk5mmG8p85UUcShwVvNWpFN1UxDAKKwiGohUKeyaom8BYznHRMSSd4oqlOJk7ZPO/nqXFOYa3JnAdyo626fd01CpN1FW6yiTZyps7i0h+0tvLcGg+YVH+IY1HoVnzlwzUkz5XM2NIqqB/FbcIWV5AHn4QEYyBRfM7JJLM2e0h/CbLuAdQ9Kcf9YlcPzp9J1lHUsc5ajjcv8AFlqWa+hwOAD8QCA9g9HggIvaj+z3Mu23vf4cOVPOsXCMa6Isag5kKbv9IE5CkdEvtsUIXjTgFQEpvsCX2BjRmOJpW6GwypminNNwFvyu4aD6/uEBEJ+EIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCIPGbcV5GsonXMQ7Uny4+vCvCJyKxjCZJJMxatnCgPK3gQihil08Khw7gDX486DQYDz10tYnmUvnzFrLHOybOTOzu6U5hKe28nkBAHT+k9rWM6YyibThFPYZPMnaahE7Mhoc26Br98aU0AaRs+PJi+keXPpHLJTsahykXe7Dmu0lOG+Jx15Wj4vwr85LMG2JMvbulGZJqKfqSJklxvgA6gf7ojAUZHo7x08Z/SmuyN0z3k252QqfzAB0Hhy8MW2U/m/LSnuOZMplpZJGzFPabDaWhuEARHiFPX5Rck+jfC+cmq+au5mp7bp2cxv3CERuLCyTDaP5nk7Fu9vsQOmgXMu8R68dKgBfUfcgOZ86Slay6TVJd+9USsOjl7qRR72ZTWo6bleW9xEI4nzbMZyZ/OJwm4ZOFSk2JraUrctwhoQNKaeEPMsdsrQ6reJ9RTho42xkY75ZdMpity3DqI6hx5V3hD2RiNazD6YnK8M5DTM3NtXUKVZX5jomHoWAkmMolqcyfKpYZmzuXKJWNewPcQwl3hGtNP4uERbiWsmchQ2pq+aTlR0Ul6iZipkLcPAT6cKc/Le4xLdIGHOq2fWnWbtxmHKiRFS429bvCJxHhoMVeXzybs/qnyiifjRP2qZ/QSDpAWZ05mUnmWwKq9fJ7OXMWQ3liJn5V1EQoIaGqU1eUQWKJHKJgzaOvyvPLMwhkiLHaHMmrwExFLBACH04G/eUIlpLMcxF26w8kg0mKjex0yyymTVL4jpV10/Z/86RxTBtJJeigw27rOXTNuXbiEt7I1oCU4ByOAjeXT3fOApqnRc9eZfUU8kUzTT7hEH28Q3mBB4fCsQy2AMYyfL27Dz5wmmey9BPPNbcPEE76hqP7o/c8lCkrmS8rddoo3PZen3Tl4lOAeQgID846ZPM8SN1k2snmc2zPAigoc38AcYCd6EVOr5w+lbrPTcOG5TkRPum7A1DDrz3wHhG34Vb7XPUE+zy0+1OQhN20O6O9xCtPUKRlPXXSYz2RrM0mjtR4rY1ZPkCGWV9bCagAeZhCNGw9OGzeY7Bmp7awyzzQkruKUhj1EpATrrw3vFT3h0DWoR8Gjhs7RzWypFEx8RBj7wCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQCEIQHM+SUXZqJouDoKHLunDwxlc0+h5+3JKN9nMZZc5zlSTIbUTKCca/GtfejXYxT+U5PCSOTopCyTV6zbOW66wL2GIWzc3LRv4j5cPXQMomXSC+keMJsq6y38mcOFEXTY+8U6JD5RgJrQOID7Oo+Y15sUSNk3ZoYjwy52/DL/6g/ibm8SZ+YCA6f8A640lRPLRU/nGWQ15PCcompoAfHh5h6azfR7P/wAk3i7XZdvkT8ljptvGKqUDAB1A8jgA+l1PgIBISXEM7k/+55m7b+wiRS5M/wBwak/dGqlNNvyqdv0mKczTlCWSfMtKXMDU5wEQ0G8Tn3aRQplh5tL5xJpzJ3W34dfukzoOvYqcLiH8jhr9qg+IBCLcVL/xQ6682BxtCnY93aN5TcGvGvxHnu92A5cQL7PJ0GrVJNvt/wBOXIRO0tomHJT05AGvxGK8aLNPJe5mmME2DZJTtEm5CHy7ikTFIm+PoERM8kz6TrJtXySaaim+nYoU27dSunABgP1NJ9NppmbS+UUTUt7HM7PTu6RHppqKLZSSSiiincITeMf5R1yNs2eTho1cq7O3UVKQ5/vcP+8fefINpXOFEpO+UcJp2nI5IoW670EOFOHygO6ZYeneG8ic5qaeXlnIfMtNmCWtlnGoa/IImipquNrYSeRoL9btyviH3bm+6IGAKhrQ9fs1iExFiyZTxmmwdJIbOnl2dn2lwFoY9fMdfxiVw+XMRw2l1wpKMxJwTOIoUpjlzwtJr5jWA+mF8OSTEGQ6njFRdwzSM0szDFL2ZqlvAOI0UAPuxYp5M5bg+WptZZLENteHsYy9qmUplTeY05B4hioYdnKeG5OuqkkpM1FH+ztSIJm+kKCTdDUKgGgcoi8XTxzgtFd+5VTf4yfpGvW/VsEwKAmInyqACGn3u73w/GLsQOcJ56STpB/jJ+l9Oe/q5anoOSn5DqH9o3IBqvRDMNjxg7fqq5bJRJRVc+ZvEKBQOY4iPMDjT7w+cVr9IeZqquYpvHXOdS4xzAYBqI+ta1+EReX2yeV9ZvX+yQoEIBv4wEID2X0ajt6BZyxc1lqgmty0zFKubuiYSj5W0raHDjQKDfYhMDNAYYJkjTcJkMESUJ3dCBE3AIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAcz1yDRko5OkdTLLdYmFxjfCMX6S5Mpi+WLovnSCji8qrUhyWlKYKgAAIAPEBEn3hjcYquJcPNlEFnTJMU1CFUVOiQN1Uw619D18XqNwGgPGLxs5lbxRq++juG5yk7fslCUMA2H/AHa902hro4mpmyiKaSXaKWJksJ3bhNThzEKAFPQI1PpAxVh/EGD01ZYqxcOL8mx0gQzgiYpH4EHxgNBqUbfe4xkEllz1m8TdJOU8tS4nZqGuVKch/MOAhUkBuuA9il+D02vYO2TwhjuiId05ru+HkclKFH3fmEqsZizxU+26Rbeo/SzWpN3cUHiAAIDrfeHy7oxjOFXLlxOJMwaqqZaj8pPeuPRM4j8SafIfONmfKzKcTieqsezcSh/9BWJ6lodP41IJy+oiXmWA+Dpd9K+rZylmJuGFrF8jmexqQD05HJp8ogp9OH08eJun2XmJksvInbu3Vp8osbd8koz60VfKTOYv1cp1LD7xTpiYbQD2KUqUfDpEW+w8opmKyfMdpp99H+dN/Q5OfxLAQEfoxFU8zslOz3D+56R+rdnW+kpKd/fJ3TfDhpF7xJMvysk7RrLJO7UU3VjnzOzSMFSUOIhQdOdQ5QFEboKOFk2rVLMUUPYQntmGLosqxl+ZtUn6zlzNrsKC27l5wanHUB1E56f9IxyS9s2k+XlKqKOFDlbrzNBO5FkU9bgTHS89AHf8Mfl8dJPPlaU4UUwyz+kLrd6wum4HrXQoeIRE0B24fN1XJ2OU2+muM5wgc6d2VWhKhyvsAP8A5PkOfdJUzSmkhmTVJrmKSx7258y4xynIcCraf0ghdx4ga7WL3K5v15g9Cc7Llqbasjkk8BbbyE+RCEJ8g3YxRGY/n7rR99I2z9KRJ4in+tAnoJO78oDnUN2yiv1adiaO/wDtArp/yu+zFq6HZOxmmKs11sjhNolnZK6lxjmAwAQRAPKtTacRIX0iqS9Nyz/WoOHuz7l6ZbUjDXUK1pz173C2kXfoimThJ2STyPD3W05dqmSvUd5SZEw1rdln04nMNPLdPugIek8CPnOrA5s1uO8iKaFpUuZgEeYDXy4111LFzjjYM2zNEU2yZE67x/eN5iPOOyAQhCAQhCAQhCAQhCAQhCAQhCAQhCAQhCAQhCAQhCARD4qd7HIV1CAcVFOyTsPaa42lQHl5xMRHzWWMpokRJ6mZRNM95QA5i62iXlx0EfxgPEuMGbFniR8lJ3LRw22jNJkKfHc8qkGoGt5fKIwxk3H85zE3FtnhMQ11a/vEfiAxuHSF0AOCKqP8Fus9NQbjslzlIoQwfsh0Tp7hgCmu9yjKvyFxlnKZUsdp5nf7RIqZPURrSv2fSA6uiVntnSFh9JVLMyz3ns7txCifXz30x/GNn6JUk3khmz9XtOs5qs4+7p/fWMY6CV1fywm00+rbyyUOFvrCmKcxKBUBD7Y/jGqyueNsF9D8pV3FHrhIx2qPtmOYT1H3AAQ/cXnAfjEzmUyvGGUxnCDCcpkzr1N1E5h5KDwIpTX2TVC6ldeRw6SbozJXEMsd9cuDlO1c90t1o6gICGnDuiJTV7ukZU6cquFlFXSqjhwoe85/Ecw8x+cXvBeH8bN2earM1MOyr/z28U/wQPoI/IPtQFhmk8cs5bLdhxMu4cKE7ci+9lcuZK8QHndw3dY+symskTnzTbpm+n0qyinOie7cUE1SjTcDhypy7sTTGTy2YIqbM1aKbO4K3Osu0Ilea6hqEIGgfa/qjEY+aOds/wBmXzFg9bqmSOydNCFK4MQ1DWLkCtK8tDfCA5ZSxnbxmpJksxhJnCuaRFTeWOW4OHARDTiahNYoONpi52xSQ7MowZMFTfRj7xjqftFB8YiHd8JQHd8x1eV40bS9bqvE0sUw69U8Z95uqbzzP7zV+1HF0uYVTnktTn0s7R63S8G9tCPHSnEQ4l9rUvswFW6NX2z9HuIFcrM2B0V3Z8S2U/AkZH9Ysp2qaeYT67LtLl6DSnxvCn+Eaf0Rrp5OKGuVtGZLdryf2uT3Q/jp84y5unloqbUqpmf0G8b4CNOH4F1GA/Tj/wBtPf3DkQMYypvTz+NY3f8Ak5SZtI5j1ztDRy5d/QvoqhTFblGg2H55gmAgmLyAKxgjdNXbEMrMdqKHKQnfLvDoUhKUARHyKHPux6J6C+iJs2Zpz7FTGZN5im4vatlF7SkKFBKcaDeOtd1SnAbij3hDfIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAIQhAI+DsypEFDpJgopaNhBPbcbkFeUfeEBn01xhKJ/g+coy5ysxnDVqqrsSwZblJRKp6AHMQEnhrSJXo7xU2xXIwV3U5g3oV0jXum9oPdH/ABDlFN6bcFgvfieXJgcbQB8j7RQ/Wh8A73oFeQ1zbCs4mUknqD+WfpF5UcnwuCiYAyx+I0+dID1PGEzjFUkl8+UYPnKiaiZ+3v8AAYeSh+Q67w+Go+IRGLlPekFufo+PPZH+kHODew/eaqGrW8PSg28h0jBnmHnLxHb0v0hTfyT95X2j/HiPvAVQ3Koh2yWTTaRs8dKzNJNRRRui3QWQQKUrgq6pw3CAAU5bnhMNvx/TrDE3miKE0xg+QwzKm7dNu1RX3lsshaFIQnERHXyNUe7yju6P8UOW7NfDjl8pLHluSxWUQzTEUuECpiAjTQT/ALrNN2KBjyXYkl8yUdYmVUdqKHNkOdrOZNUocvdD0oS2AtDjFuH8HrJpYUwyuo87m2ThMySxzD3bCCTcr50+6NYzeaJdK2NNrnzlWZOG6eZ3HZUkyU7xEyX6hp/rEk3Ve4knDFgk6UcOXBCtEL1CG+yQ561HiOpqxPSmQYtcSGc4cSSUaN37fsJgS1dudQNTAKyNQAFCBYYfhu8oDSv5Pc6TnnRugrmruHDd0i3dHXuuOsQidwiI8a1Aa+vtRkvS9MZvizpCd4XwftzhRg4dHdEIpkFOpnjfxEKgGgV9d31tvQXNWOA8NzaQ4hVy3vXWd2CZlUzpgRIhhAQDzIf8IgcH4fmzjpUnuPGqv5q6yfq5JEzKuHSZzCchATAOYHIPytgI3AfSDi2R7XhzFbFebsk7SZM13jJG8IVPqIezxtpzi/4PnkkeLZuC56vhl6of/dM1uM0VN7hx4CP9f3QigYslE/edZT6etU26e0J3kOuQyyV9QJ2YCIhQAECiYA4e1UQglip5OblKJp2WXnXNaQvyEfwpbpAbRhWXPZf0tfnORKSxOZt1kjkJvNzmtE5ss/kNlbO8WKJg3CqTNHrTEP0eTNzmSIQihymdKAalACo6VAdfTnrE10PzjFoTEjZjN0CYeb/pSzpMyrZqmBa8a6DQKFAo6iYNPFHVPlX2KJkmrlKJypuZQiF9xSnLcJ71NNBy6bneKRP0MMBrHQjLcJuCuJxJpY0zE7SEXy+0SNvAclRqYpuF2uoCHEtom1aPOHRa8ncnxq1YMWx+3VK3dNvCZMvE3luBUSj/ANIxbul3Ht4LYckavDceuSD+KRB/tD93jWgS7XGiE36RRSRepoyOUNVljuDqWJqqXETvE3C0LxAvzNrpFlwzidjiOYuk5Qiuszabijw5bUzKewQB1HTUR08PGsee8NSJ7iOboSxil2inj8KSfM4+gfxaF5x6Vw3J2UhkyErYp0SQL5bxzczD6iOsBKQhCAQhCAQhCAQhCAQhCAQhCAQhCAQhCAQhCAQhCARifSdgE8rXXnsjTUCXnKYHaCCYZjUpuJ0/c9oOQCPgE1NshAeXW6rnOXftsvZ1EsrZl091wmQvAQJ74CJddy09pgKjUPomhtCK6UozzpqF7eX7pnbcugK5dQosFpADhcFoXFAAMJ9Oxz0bZ6q81wsYGjxQps5neYiavAakEPqz6B6D3dAE1cv2TL/Nb5JdpMW581fPTMVQhridtf5VGhde4B1e9oIfB40luIGae0pNGiadxNxfdSTIXdDluASp/dIiO9cpEJMsNbZPs2cPps79vumWIUlE6UrQaKdnStphKfeGtRlp0vO1EU3XZ7YnafbO6oqUaBRWmojUQAwm3qiG8JRLWOa4jUbrfTklE+yszib26BT2nrzG85D+8ZMN7UwwFpwrhDAsvXbzRLF7pOYNHSK2zOkCNeBwqQa8dK900ZThfoTxb2brrxiwU3SXsVFVVP69CE5eE4xfGryUOEWjVJ0pl7Qnn32mMRO6lbw8iCBOX1QGtCunXLWrZwshszVRNRwRRY+RcU31uUUmhxAKAIH4e9dbAOjlNLC60yYYhkU2n2YfZ9t6tOqoqUTHIqJxER3NwOYmrWKct0ZYgxgiu/6zXlCajizq9RocqOpQEpwAVK0G8A7g6AG8MaCmvMvrUsQz39CTWJ9OV36kE5ACoUp87de8EfFw2cuNkavpnMnGYRuTt3xlSpGE4kOAAPAO5p4awFZ6JujeXYfVnMrxxOJSnL3h2qv0VcxVDFRK4HuHIU4anJyj7zPCWBk3i/5PqTydJpgY96wlTTIXzExClUG2g+x8R1jvKSUJy361BvtDUq31hjGIbtBppWzfAgG9A9dfkbFTFui0+vdqJ29iRTd3MsC0HUBrlANKfrVC89A/Mtw4yTRUdK5bfaG5liHJfaSha6iIDw3xoX9krvaVGblbHrR4fqxJBvshTKulj5STeWqDTfBYQE4UEOCYluMndqBhpTU1ZvMEU2Gam0b3l3z289KiPGmtaG9TRaWbbLlrRq5VTTbpn3Gx0ylRSWCuqgX9oIiB7hNU1Ezl8ZKB3PZ+zk7NSWYVVX7Qljqan3Vly/s0ifqUg8IF/d3jQUgk72dzEkrljbMcKf1Sl9s48iB/netLFhwxg6ZYvWQdMWyjBlYXPcr7xbtQ3NAzBpS7QC1rvRt+E8NyrDMt2aXI0E2qyx9VFTeZh/u4BAc2BsKssKScrRqALuVRvdOTd5U39xQ8If3iIxZoQgEIQgEIQgEIQgEIQgEIQgEIQgEIQgEIQgEIQgEIQgEIQgEQ2JcOSXEbTZpuxIuHgP3Tk+yYNQiZhAY5iHoxnbTMVkcyUmad5j5Lpcya+pLPrA0ObgJRNS0xSD4YpM7ScNFT/lLKHTBwoa895LSqqB2m4oGg6iun9lUnsDHpmPmskkoiKaiZDk9kwaQHkaZSqW9hlWOFMopznIoXvcDdylNQEad6gh5xqfQvgeQTfCrt1N2O2Co9MRAx1z3FTAhNNDed8aBNOj/B0wCq0ibp/wDpbkP/AKxLWJmTyxlKJchL5c2Ig3Q7ieo+o6jqI15wGdzro/wc0m+UnLHeXlFNYmuua0wmNzqPHT8IlsP9G+CurWrnqcFFVEi3nUXVNvU10E+mtdIs86kTKbrEVchvpkMQDAmQw2mpUN4B8ok0E00kSJphaQhbS/CA8u9I+HpbL8dzVqk2sTTVKchMw1pSnIQ+nprT5REs02LdZPNap7PmlzCE3c0t28HzDSPTOIMFYbn8xI+mcuFVwQtl5Fzp3F9bBCsd0mw9JZPrLZS0aqDxUImF5vibiMBhzLB2I8RpJg2lqjdMT3ncuk8hNUwlqc9ghfqcTiW0OFl3cLGh4b6MZUzAF544UnLi68U1AtbAalK5fjGmlTVr5RokID8FKBAy0wAsfuEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEIBCEID//Z';

const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEF_ROWS = 20;
const DEF_COLS = 8;

const mkEmptyGrid = (rows, cols) =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      v: '', bold: false, italic: false, align: 'left',
      fontSize: 11, bgColor: '', textColor: '', border: false, wrap: false,
    }))
  );

// ── TUTORIAL STEPS ────────────────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  {
    title: '📊 Editor de Planilha',
    body: 'Bem-vindo! Este editor funciona como o Excel diretamente no navegador. Clique em qualquer célula para editar o conteúdo. Use Tab para avançar e Enter para descer.',
    tip: 'Atalho: Ctrl+B = negrito, Ctrl+I = itálico',
  },
  {
    title: '✏️ Editar Células',
    body: 'Clique em uma célula e comece a digitar. A barra de edição acima mostra o conteúdo. Pressione Enter ou clique em outra célula para confirmar.',
    tip: 'Você pode usar = no início para fórmulas simples como =2+3',
  },
  {
    title: '🎨 Formatação',
    body: 'Selecione uma célula e use a barra de ferramentas: Negrito (N), Itálico (I), alinhamento e cor de fundo. Para múltiplas células, segure Shift e clique.',
    tip: 'Cabeçalhos ficam ótimos com negrito + fundo verde escuro',
  },
  {
    title: '📐 Linhas e Colunas',
    body: 'Use os botões "+ Linha" e "+ Coluna" para adicionar. Clique com botão direito no cabeçalho da linha/coluna para deletar. Arraste as bordas para redimensionar.',
    tip: 'Você pode adicionar até 50 linhas e 26 colunas',
  },
  {
    title: '🖨️ Brasão Militar',
    body: 'Na aba "Cabeçalho", você pode adicionar o brasão oficial ao documento, escolher título e informações da unidade. Aparecerá no Excel e no Word.',
    tip: 'O brasão é o Brasão de Armas da República Federativa do Brasil',
  },
  {
    title: '📄 Exportar Word',
    body: 'Clique em "📄 Word" para gerar um documento Word (.docx) com todo o conteúdo da planilha formatado profissionalmente, pronto para impressão em A4.',
    tip: 'O Word gerado é idêntico ao que você vê na tela',
  },
  {
    title: '📊 Exportar Excel',
    body: 'Clique em "📊 Excel" para baixar o arquivo .xlsx com toda a formatação: cores, negrito, bordas e o brasão no cabeçalho.',
    tip: 'O arquivo Excel pode ser aberto no Microsoft Excel, LibreOffice ou Google Sheets',
  },
];

// Responsive spreadsheet styles injected globally once
if (typeof document !== 'undefined' && !document.getElementById('planilha-responsive')) {
  const style = document.createElement('style');
  style.id = 'planilha-responsive';
  style.textContent = `
    @media (max-width: 768px) {
      .planilha-toolbar { overflow-x: auto; flex-wrap: nowrap !important; }
      .planilha-grid { overflow: auto; -webkit-overflow-scrolling: touch; }
    }
  `;
  document.head.appendChild(style);
}

export default function AdminPlanilhaPage() {
  const [grid, setGrid]           = useState(mkEmptyGrid(DEF_ROWS, DEF_COLS));
  const [selCell, setSelCell]     = useState({ r: 0, c: 0 });
  const [selRange, setSelRange]   = useState(null);
  const [editVal, setEditVal]     = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [colWidths, setColWidths] = useState(Array(DEF_COLS).fill(110));
  const [rowHeights, setRowHeights] = useState(Array(DEF_ROWS).fill(26));
  const [activeTab, setActiveTab] = useState('planilha');
  const [exporting, setExporting] = useState(false);

  // Header config
  const [showHeader, setShowHeader]   = useState(true);
  const [docTitle, setDocTitle]       = useState('DOCUMENTO OFICIAL');
  const [docUnidade, setDocUnidade]   = useState('MINISTERIO DA DEFESA\nEXERCITO BRASILEIRO\nCOMANDO MILITAR DO PLANALTO');
  const [docLocal, setDocLocal]       = useState('Brasilia');
  const [docData, setDocData]         = useState(new Date().toISOString().slice(0,10));
  const [docAssinante, setDocAssinante] = useState('');
  const [docCargo, setDocCargo]       = useState('');
  const [sheetName, setSheetName]     = useState('Planilha1');
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutStep, setTutStep]         = useState(0);

  const inputRef = useRef(null);

  const cell = grid[selCell.r]?.[selCell.c] || {};

  const setCell = (r, c, patch) =>
    setGrid(g => g.map((row, ri) => ri !== r ? row : row.map((col, ci) => ci !== c ? col : { ...col, ...patch })));

  const updateEditVal = (r, c) => setEditVal(grid[r]?.[c]?.v || '');

  const startEdit = (r, c) => {
    setSelCell({ r, c });
    setEditVal(grid[r]?.[c]?.v || '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    setCell(selCell.r, selCell.c, { v: editVal });
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { commitEdit(); moveCell(1, 0); }
    if (e.key === 'Tab')    { e.preventDefault(); commitEdit(); moveCell(0, e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') { setIsEditing(false); }
    if (e.ctrlKey && e.key === 'b') { e.preventDefault(); toggleFmt('bold'); }
    if (e.ctrlKey && e.key === 'i') { e.preventDefault(); toggleFmt('italic'); }
  };

  const moveCell = (dr, dc) => {
    setSelCell(prev => {
      const nr = Math.max(0, Math.min(grid.length - 1, prev.r + dr));
      const nc = Math.max(0, Math.min(grid[0].length - 1, prev.c + dc));
      updateEditVal(nr, nc);
      return { r: nr, c: nc };
    });
  };

  const selectCell = (r, c) => {
    if (isEditing) commitEdit();
    setSelCell({ r, c });
    setEditVal(grid[r]?.[c]?.v || '');
    setIsEditing(false);
  };

  const toggleFmt = (key) => setCell(selCell.r, selCell.c, { [key]: !cell[key] });
  const setFmt = (key, val) => setCell(selCell.r, selCell.c, { [key]: val });

  const applyToRange = (patch) => {
    if (!selRange) { setCell(selCell.r, selCell.c, patch); return; }
    const r1 = Math.min(selRange.r1, selRange.r2);
    const r2 = Math.max(selRange.r1, selRange.r2);
    const c1 = Math.min(selRange.c1, selRange.c2);
    const c2 = Math.max(selRange.c1, selRange.c2);
    setGrid(g => g.map((row, ri) => ri < r1 || ri > r2 ? row : row.map((col, ci) => ci < c1 || ci > c2 ? col : { ...col, ...patch })));
  };

  const addRow = () => {
    setGrid(g => [...g, Array.from({ length: g[0].length }, () => ({ v:'',bold:false,italic:false,align:'left',fontSize:11,bgColor:'',textColor:'',border:false,wrap:false }))]);
    setRowHeights(h => [...h, 26]);
  };
  const addCol = () => {
    setGrid(g => g.map(row => [...row, { v:'',bold:false,italic:false,align:'left',fontSize:11,bgColor:'',textColor:'',border:false,wrap:false }]));
    setColWidths(w => [...w, 110]);
  };
  const delRow = () => {
    if (grid.length <= 1) return;
    setGrid(g => g.filter((_, i) => i !== selCell.r));
    setRowHeights(h => h.filter((_, i) => i !== selCell.r));
    setSelCell(prev => ({ ...prev, r: Math.max(0, prev.r - 1) }));
  };
  const delCol = () => {
    if (grid[0].length <= 1) return;
    setGrid(g => g.map(row => row.filter((_, i) => i !== selCell.c)));
    setColWidths(w => w.filter((_, i) => i !== selCell.c));
    setSelCell(prev => ({ ...prev, c: Math.max(0, prev.c - 1) }));
  };
  const clearCell = () => { setCell(selCell.r, selCell.c, { v:'' }); setEditVal(''); };
  const clearAll = () => { if (!window.confirm('Limpar toda a planilha?')) return; setGrid(mkEmptyGrid(grid.length, grid[0].length)); toast.success('Planilha limpa'); };

  const isInRange = (r, c) => {
    if (!selRange) return false;
    const r1 = Math.min(selRange.r1, selRange.r2), r2 = Math.max(selRange.r1, selRange.r2);
    const c1 = Math.min(selRange.c1, selRange.c2), c2 = Math.max(selRange.c1, selRange.c2);
    return r >= r1 && r <= r2 && c >= c1 && c <= c2;
  };

  // ── EXPORT EXCEL ─────────────────────────────────────────────────────────────
  const exportExcel = async () => {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SIM — Sistema Interno Militar'; wb.created = new Date();
      const ws = wb.addWorksheet(sheetName || 'Planilha');

      // Set column widths
      grid[0].forEach((_, ci) => { ws.getColumn(ci + 1).width = Math.round(colWidths[ci] / 7); });

      let startRow = 1;

      if (showHeader) {
        // Brasão image
        const bin = atob(BRASAO_B64); const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const imgId = wb.addImage({ base64: BRASAO_B64, extension: 'jpeg' });

        const hdrRow = ws.addRow(['']);
        hdrRow.height = 80;
        ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 80, height: 80 } });
        startRow = 2;

        // Unidade lines
        docUnidade.split('\n').forEach(line => {
          const r = ws.addRow(['']); startRow++;
          ws.mergeCells(r.number, 1, r.number, grid[0].length);
          const c = r.getCell(1);
          c.value = line; c.font = { name:'Arial', size:10, bold:true };
          c.alignment = { horizontal:'center', vertical:'middle' };
          r.height = 16;
        });

        // Title
        const tRow = ws.addRow(['']); startRow++;
        ws.mergeCells(tRow.number, 1, tRow.number, grid[0].length);
        const tc = tRow.getCell(1);
        tc.value = docTitle; tc.font = { name:'Arial', size:13, bold:true };
        tc.alignment = { horizontal:'center', vertical:'middle' };
        tRow.height = 22;

        // Date/local
        if (docLocal || docData) {
          const dRow = ws.addRow(['']); startRow++;
          ws.mergeCells(dRow.number, 1, dRow.number, grid[0].length);
          const dc = dRow.getCell(1);
          dc.value = `${docLocal}${docData ? ', ' + new Date(docData+'T12:00:00').toLocaleDateString('pt-BR', {day:'numeric',month:'long',year:'numeric'}) : ''}`;
          dc.font = { name:'Arial', size:9, italic:true };
          dc.alignment = { horizontal:'center' };
          dRow.height = 14;
        }
        // Separator
        const sep = ws.addRow(['']); startRow++;
        ws.mergeCells(sep.number, 1, sep.number, grid[0].length);
        sep.getCell(1).border = { bottom: { style:'medium', color:{ argb:'FF2a4020' } } };
        sep.height = 6;
      }

      // Data
      grid.forEach((row, ri) => {
        const exRow = ws.addRow([]);
        exRow.height = rowHeights[ri] || 26;
        row.forEach((cell, ci) => {
          const exCell = exRow.getCell(ci + 1);
          // Evaluate simple = formulas
          if (cell.v.startsWith('=')) {
            try { exCell.value = { formula: cell.v.slice(1) }; }
            catch { exCell.value = cell.v; }
          } else {
            const num = Number(cell.v);
            exCell.value = cell.v !== '' && !isNaN(num) && cell.v.trim() !== '' ? num : cell.v;
          }
          const fnt = { name:'Arial', size: cell.fontSize || 11 };
          if (cell.bold)   fnt.bold = true;
          if (cell.italic) fnt.italic = true;
          if (cell.textColor) fnt.color = { argb: 'FF' + cell.textColor.replace('#','') };
          exCell.font = fnt;
          exCell.alignment = { horizontal: cell.align || 'left', vertical:'middle', wrapText: cell.wrap || false };
          if (cell.bgColor) exCell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FF'+cell.bgColor.replace('#','') } };
          if (cell.border) {
            const bd = { style:'thin', color:{ argb:'FF999999' } };
            exCell.border = { top:bd, bottom:bd, left:bd, right:bd };
          }
        });
      });

      // Signature
      if (docAssinante) {
        ws.addRow(['']);
        ws.addRow(['']);
        const sigRow = ws.addRow(['']);
        ws.mergeCells(sigRow.number, 1, sigRow.number, grid[0].length);
        const sc = sigRow.getCell(1);
        sc.value = docAssinante; sc.font = { name:'Arial',size:10,bold:true };
        sc.alignment = { horizontal:'center' };
        sc.border = { top:{ style:'medium', color:{argb:'FF333333'} } };
        sigRow.height = 20;
        if (docCargo) {
          const cRow = ws.addRow(['']);
          ws.mergeCells(cRow.number, 1, cRow.number, grid[0].length);
          cRow.getCell(1).value = docCargo; cRow.getCell(1).font = { name:'Arial',size:9,italic:true }; cRow.getCell(1).alignment = { horizontal:'center' };
        }
      }

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), `${sheetName||'planilha'}_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('✓ Excel exportado com brasão!');
    } catch(e) { console.error(e); toast.error('Erro ao exportar Excel: ' + e.message); }
    finally { setExporting(false); }
  };

  // ── EXPORT WORD ──────────────────────────────────────────────────────────────
  const exportWord = async () => {
    setExporting(true);
    try {
      const bin = atob(BRASAO_B64); const bytes = new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
      const mkT = (t,sz=20,b=false,it=false,color=undefined) => new TextRun({ text:t, bold:b, italic:it, font:'Times New Roman', size:sz, ...(color?{color}:{}) });
      const cb = { style:BorderStyle.SINGLE, size:1, color:'AAAAAA' };
      const bds = { top:cb, bottom:cb, left:cb, right:cb };
      const A4 = { page:{ size:{width:11906,height:16838}, margin:{top:1000,right:1000,bottom:1000,left:1000} } };

      const children = [];

      if (showHeader) {
        children.push(new Paragraph({ alignment:AlignmentType.CENTER, children:[new ImageRun({data:bytes,transformation:{width:70,height:70},type:'jpg'})], spacing:{after:80} }));
        docUnidade.split('\n').forEach(line => {
          children.push(new Paragraph({ alignment:AlignmentType.CENTER, children:[mkT(line,20,true)], spacing:{after:30} }));
        });
        children.push(new Paragraph({
          alignment:AlignmentType.CENTER,
          border:{ bottom:{style:BorderStyle.SINGLE,size:6,color:'2a4020',space:1} },
          children:[mkT(docTitle,22,true)], spacing:{before:80,after:100},
        }));
        if (docLocal || docData) {
          const dateStr = docData ? new Date(docData+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '';
          children.push(new Paragraph({ alignment:AlignmentType.CENTER, children:[mkT(`${docLocal}${dateStr?', '+dateStr:''}`,18,false,true)], spacing:{after:140} }));
        }
      }

      // Table from grid
      const totalWidth = 9000;
      const colW = Math.floor(totalWidth / grid[0].length);
      const colWidthsArr = grid[0].map(() => colW);

      const tableRows = grid.filter(row => row.some(c => c.v !== '')).map(row => new TableRow({
        children: row.map((cell, ci) => new TableCell({
          width: { size:colW, type:WidthType.DXA },
          borders: bds,
          margins: { top:60, bottom:60, left:80, right:80 },
          shading: cell.bgColor ? { fill: cell.bgColor.replace('#',''), type:'clear' } : undefined,
          children: [new Paragraph({
            alignment: cell.align==='center'?AlignmentType.CENTER:cell.align==='right'?AlignmentType.RIGHT:AlignmentType.LEFT,
            spacing: { after:0 },
            children: [mkT(cell.v, (cell.fontSize||11)*2, cell.bold, cell.italic, cell.textColor?cell.textColor.replace('#',''):undefined)],
          })],
        })),
      }));

      if (tableRows.length > 0) {
        children.push(new Table({ width:{size:totalWidth,type:WidthType.DXA}, columnWidths:colWidthsArr, rows:tableRows }));
      }

      // Signature
      if (docAssinante) {
        children.push(new Paragraph({children:[], spacing:{after:600}}));
        children.push(new Paragraph({
          alignment:AlignmentType.CENTER,
          border:{top:{style:BorderStyle.SINGLE,size:4,color:'333333',space:1}},
          children:[mkT(docAssinante,20,true)], spacing:{before:0,after:40},
        }));
        if (docCargo) children.push(new Paragraph({ alignment:AlignmentType.CENTER, children:[mkT(docCargo,18,false,true)], spacing:{after:0} }));
      }

      const doc = new Document({ sections:[{ properties:A4, children }] });
      saveAs(await Packer.toBlob(doc), `${sheetName||'documento'}_${new Date().toISOString().slice(0,10)}.docx`);
      toast.success('✓ Word exportado!');
    } catch(e) { console.error(e); toast.error('Erro ao exportar Word: ' + e.message); }
    finally { setExporting(false); }
  };

  // ── COLOR PRESETS ─────────────────────────────────────────────────────────────
  const BG_PRESETS = ['','1a2e12','2a4020','253818','4a6040','6b7c5e','a8b89a','d0d8c8','e8e4d0','f4f2ea','ffcccc','ffe0b2','fff9c4','e3f2fd','f3e5f5','ffffff'];
  const TXT_PRESETS = ['','ffffff','e8e8e8','c9a84c','ffd700','000000','2a4020','c0392b','2980b9','555555'];

  return (
    <div className="page-container fade-in" style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Header */}
      <div className="page-header" style={{ flexShrink:0, flexWrap:'wrap', gap:8 }}>
        <h1 className="page-title">📊 <span>Editor</span> de Planilha</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>{setShowTutorial(true);setTutStep(0);}}>❓ Tutorial</button>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>🗑 Limpar</button>
            <button className="btn btn-outline btn-sm" onClick={exportWord} disabled={exporting}>📄 Word</button>
            <button className="btn btn-primary btn-sm" onClick={exportExcel} disabled={exporting}>{exporting?'..':'📊 Excel'}</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:2, marginBottom:12, background:'var(--bg-dark)', border:'1px solid var(--border)', borderRadius:6, padding:3, width:'fit-content', flexShrink:0 }}>
        {[['planilha','📊 Planilha'],['cabecalho','🎖 Cabeçalho'],['preview','👁 Preview']].map(([id,lbl])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{ padding:'6px 14px', borderRadius:4, border:'none', cursor:'pointer', fontFamily:'var(--font-display)', fontSize:'0.58rem', letterSpacing:'0.07em', textTransform:'uppercase', transition:'all .15s', background:activeTab===id?'var(--accent)':'transparent', color:activeTab===id?'var(--bg-dark)':'var(--text-muted)', fontWeight:activeTab===id?700:'normal' }}>{lbl}</button>
        ))}
      </div>

      {/* ── PLANILHA TAB ── */}
      {activeTab === 'planilha' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Toolbar */}
          <div style={{ background:'var(--bg-dark)', border:'1px solid var(--border)', borderRadius:4, padding:'6px 8px', marginBottom:8, display:'flex', gap:4, alignItems:'center', flexWrap:'wrap', flexShrink:0, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            {/* Cell address */}
            <div style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--accent)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:3, padding:'3px 8px', minWidth:42, textAlign:'center', flexShrink:0 }}>
              {COLS[selCell.c]}{selCell.r+1}
            </div>

            {/* Edit bar */}
            <input
              ref={inputRef}
              style={{ flex:1, minWidth:120, background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)', padding:'3px 8px', fontFamily:'var(--font-mono)', fontSize:'0.78rem', borderRadius:3, outline:'none' }}
              value={editVal}
              onChange={e => { setEditVal(e.target.value); if (!isEditing) setIsEditing(true); }}
              onKeyDown={handleKeyDown}
              onBlur={commitEdit}
              placeholder="Valor ou =formula"
            />

            <div style={{ width:1, height:22, background:'var(--border)' }} />

            {/* Format buttons */}
            {[['N','bold',{fontWeight:700}],['I','italic',{fontStyle:'italic'}]].map(([lbl,key,style])=>(
              <button key={key} onClick={()=>applyToRange({[key]:!cell[key]})}
                style={{ padding:'3px 9px', border:'1px solid', borderRadius:3, cursor:'pointer', fontFamily:'var(--font-display)', fontSize:'0.72rem', transition:'all .15s', ...style,
                  borderColor: cell[key]?'var(--accent)':'var(--border)',
                  background: cell[key]?'rgba(107,124,94,.25)':'var(--bg-card)',
                  color: cell[key]?'var(--accent)':'var(--text-muted)' }}>
                {lbl}
              </button>
            ))}

            {/* Align */}
            {[['←','left'],['↔','center'],['→','right']].map(([icon,al])=>(
              <button key={al} onClick={()=>applyToRange({align:al})}
                style={{ padding:'3px 8px', border:'1px solid', borderRadius:3, cursor:'pointer', fontSize:'0.85rem', transition:'all .15s',
                  borderColor: cell.align===al?'var(--accent)':'var(--border)',
                  background: cell.align===al?'rgba(107,124,94,.25)':'var(--bg-card)',
                  color: cell.align===al?'var(--accent)':'var(--text-muted)' }}>
                {icon}
              </button>
            ))}

            {/* Font size */}
            <select value={cell.fontSize||11} onChange={e=>applyToRange({fontSize:Number(e.target.value)})}
              style={{ background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-muted)', padding:'3px 6px', fontSize:'0.7rem', borderRadius:3, cursor:'pointer' }}>
              {[8,9,10,11,12,14,16,18,20,24,28].map(s=><option key={s} value={s}>{s}pt</option>)}
            </select>

            {/* Wrap */}
            <button onClick={()=>applyToRange({wrap:!cell.wrap})}
              title="Quebrar linha" style={{ padding:'3px 8px', border:`1px solid ${cell.wrap?'var(--accent)':'var(--border)'}`, borderRadius:3, cursor:'pointer', fontSize:'0.72rem', background:cell.wrap?'rgba(107,124,94,.25)':'var(--bg-card)', color:cell.wrap?'var(--accent)':'var(--text-muted)' }}>
              ↵
            </button>

            {/* Border */}
            <button onClick={()=>applyToRange({border:!cell.border})}
              title="Bordas" style={{ padding:'3px 8px', border:`1px solid ${cell.border?'var(--accent)':'var(--border)'}`, borderRadius:3, cursor:'pointer', fontSize:'0.72rem', background:cell.border?'rgba(107,124,94,.25)':'var(--bg-card)', color:cell.border?'var(--accent)':'var(--text-muted)' }}>
              ⊞
            </button>

            <div style={{ width:1, height:22, background:'var(--border)' }} />

            {/* BG color presets */}
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              <span style={{ fontSize:'0.55rem', color:'var(--text-muted)', fontFamily:'var(--font-display)', textTransform:'uppercase', letterSpacing:'0.06em', marginRight:2 }}>BG</span>
              {BG_PRESETS.slice(0,10).map(c=>(
                <div key={c} onClick={()=>applyToRange({bgColor:c?'#'+c:''})}
                  style={{ width:14, height:14, borderRadius:2, background:c?'#'+c:'transparent', border:`1px solid ${cell.bgColor===(c?'#'+c:'')?'var(--accent)':'#555'}`, cursor:'pointer', flexShrink:0 }} />
              ))}
            </div>

            <div style={{ width:1, height:22, background:'var(--border)' }} />

            {/* Txt color */}
            <div style={{ display:'flex', gap:3, alignItems:'center' }}>
              <span style={{ fontSize:'0.55rem', color:'var(--text-muted)', fontFamily:'var(--font-display)', textTransform:'uppercase', letterSpacing:'0.06em', marginRight:2 }}>Txt</span>
              {TXT_PRESETS.slice(0,8).map(c=>(
                <div key={c} onClick={()=>applyToRange({textColor:c?'#'+c:''})}
                  style={{ width:14, height:14, borderRadius:2, background:c?'#'+c:'#888', border:`1px solid ${cell.textColor===(c?'#'+c:'')?'var(--accent)':'#555'}`, cursor:'pointer', flexShrink:0 }} />
              ))}
            </div>

            <div style={{ width:1, height:22, background:'var(--border)' }} />

            <button className="btn btn-g btn-xs" onClick={addRow}>+ Linha</button>
            <button className="btn btn-g btn-xs" onClick={addCol}>+ Col</button>
            <button className="btn btn-g btn-xs" onClick={delRow} style={{ color:'var(--danger)' }}>− Linha</button>
            <button className="btn btn-g btn-xs" onClick={delCol} style={{ color:'var(--danger)' }}>− Col</button>
            <button className="btn btn-g btn-xs" onClick={clearCell}>✕ Limpar</button>
          </div>

          {/* Sheet name */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexShrink:0 }}>
            <div style={{ background:'var(--bg-dark)', border:'1px solid var(--accent)', borderRadius:'4px 4px 0 0', padding:'3px 10px 3px', display:'inline-flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:'0.65rem', color:'var(--accent)' }}>📋</span>
              <input value={sheetName} onChange={e=>setSheetName(e.target.value)} style={{ background:'none', border:'none', color:'var(--accent)', fontFamily:'var(--font-display)', fontSize:'0.65rem', letterSpacing:'0.05em', outline:'none', width:100 }} />
            </div>
            <span style={{ fontSize:'0.6rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{grid.length} linhas × {grid[0].length} colunas</span>
          </div>

          {/* Grid */}
          <div style={{ flex:1, overflow:'auto', border:'1px solid var(--border)', borderRadius:4, background:'var(--bg-card)', WebkitOverflowScrolling:'touch' }}>
            <table style={{ borderCollapse:'collapse', tableLayout:'fixed', minWidth:'100%' }}>
              {/* Column headers */}
              <thead>
                <tr>
                  <th style={{ width:36, height:22, background:'var(--bg-dark)', border:'1px solid var(--border)', fontSize:'0.55rem', color:'var(--text-muted)', position:'sticky', top:0, left:0, zIndex:30 }} />
                  {grid[0].map((_, ci) => (
                    <th key={ci} style={{ width:colWidths[ci]||110, height:22, background:'var(--bg-dark)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:'0.6rem', color:'var(--accent)', fontWeight:600, textAlign:'center', position:'sticky', top:0, zIndex:20 }}>
                      {COLS[ci]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, ri) => (
                  <tr key={ri}>
                    {/* Row number */}
                    <td style={{ width:36, height:rowHeights[ri]||26, background:'var(--bg-dark)', border:'1px solid var(--border)', fontFamily:'var(--font-mono)', fontSize:'0.58rem', color:'var(--text-muted)', textAlign:'center', position:'sticky', left:0, zIndex:10, userSelect:'none' }}>
                      {ri+1}
                    </td>
                    {/* Data cells */}
                    {row.map((c, ci) => {
                      const isSel = selCell.r===ri && selCell.c===ci;
                      const inRange = isInRange(ri, ci);
                      return (
                        <td key={ci}
                          style={{
                            width:colWidths[ci]||110, height:rowHeights[ri]||26, padding:0,
                            border:`1px solid ${isSel?'var(--accent)':inRange?'rgba(107,124,94,.5)':'var(--border)'}`,
                            background: isSel ? 'rgba(107,124,94,.12)' : inRange ? 'rgba(107,124,94,.06)' : c.bgColor || 'var(--bg-card)',
                            outline: isSel ? '2px solid var(--accent)' : 'none',
                            outlineOffset: -1,
                            position:'relative', cursor:'cell',
                          }}
                          onClick={() => selectCell(ri, ci)}
                          onDoubleClick={() => startEdit(ri, ci)}
                          onMouseDown={() => setSelRange({ r1:ri, c1:ci, r2:ri, c2:ci })}
                          onMouseEnter={e => { if (e.buttons===1 && selRange) setSelRange(p => ({ ...p, r2:ri, c2:ci })); }}
                        >
                          {isSel && isEditing ? (
                            <input autoFocus
                              style={{ width:'100%', height:'100%', border:'none', background:'transparent', padding:'0 4px', fontFamily:'var(--font-body)', fontSize:(c.fontSize||11)+'px', fontWeight:c.bold?700:'normal', fontStyle:c.italic?'italic':'normal', textAlign:c.align||'left', color:c.textColor||'var(--text-primary)', outline:'none' }}
                              value={editVal}
                              onChange={e=>setEditVal(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={commitEdit}
                            />
                          ) : (
                            <div style={{ width:'100%', height:'100%', padding:'0 4px', fontFamily:'var(--font-body)', fontSize:(c.fontSize||11)+'px', fontWeight:c.bold?700:'normal', fontStyle:c.italic?'italic':'normal', textAlign:c.align||'left', color:c.textColor||'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:c.wrap?'normal':'nowrap', display:'flex', alignItems:'center', justifyContent:c.align==='center'?'center':c.align==='right'?'flex-end':'flex-start' }}>
                              {c.v}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CABEÇALHO TAB ── */}
      {activeTab === 'cabecalho' && (
        <div style={{ flex:1, overflow:'auto' }}>
          <div className="admin-grid-2" style={{ gap:16 }}>
            <div className="card">
              <div className="card-header"><h3 className="card-title">🎖 Configurar Cabeçalho do Documento</h3></div>
              <div style={{ padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:'10px 14px', background:'var(--bg-dark)', border:'1px solid var(--border)', borderRadius:4 }}>
                  <input type="checkbox" id="showHdr" checked={showHeader} onChange={e=>setShowHeader(e.target.checked)} />
                  <label htmlFor="showHdr" style={{ fontSize:'0.78rem', color:'var(--text-secondary)', cursor:'pointer' }}>
                    Incluir cabeçalho oficial com Brasão de Armas da República no documento
                  </label>
                </div>
                {showHeader && (
                  <>
                    <div className="form-group" style={{ marginBottom:12 }}>
                      <label className="form-label">Brasão</label>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <img src={`data:image/jpeg;base64,${BRASAO_B64}`} alt="Brasão" style={{ width:60, height:60, objectFit:'contain', border:'1px solid var(--border)', borderRadius:4, background:'#f0f0e8', padding:4 }} />
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontStyle:'italic' }}>Brasão de Armas da República Federativa do Brasil — oficial</span>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom:12 }}>
                      <label className="form-label">Unidade (uma linha por vez)</label>
                      <textarea className="form-control" rows={4} value={docUnidade} onChange={e=>setDocUnidade(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom:12 }}>
                      <label className="form-label">Título do Documento</label>
                      <input className="form-control" value={docTitle} onChange={e=>setDocTitle(e.target.value)} placeholder="Ex: ESCALA DE SERVICO" />
                    </div>
                    <div className="rg-2" style={{marginBottom:12}}>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Local</label>
                        <input className="form-control" value={docLocal} onChange={e=>setDocLocal(e.target.value)} placeholder="Brasilia" />
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Data</label>
                        <input type="date" className="form-control" value={docData} onChange={e=>setDocData(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom:12 }}>
                      <label className="form-label">Assinante</label>
                      <input className="form-control" value={docAssinante} onChange={e=>setDocAssinante(e.target.value)} placeholder="NOME COMPLETO - POSTO/GRAD." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cargo / Função</label>
                      <input className="form-control" value={docCargo} onChange={e=>setDocCargo(e.target.value)} placeholder="Ex: Chefe do Centro Hipico" />
                    </div>
                  </>
                )}
                <div className="form-group" style={{ marginTop:14 }}>
                  <label className="form-label">Nome da Aba / Arquivo</label>
                  <input className="form-control" value={sheetName} onChange={e=>setSheetName(e.target.value)} placeholder="Planilha1" />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><h3 className="card-title">👁 Preview do Cabeçalho</h3></div>
              <div style={{ padding:16, background:'#f4f1e8', borderRadius:4, margin:12, fontFamily:"'Times New Roman',serif", color:'#1a140a' }}>
                {showHeader ? (
                  <>
                    <div style={{ textAlign:'center', borderBottom:'2px solid #2a4020', paddingBottom:12, marginBottom:12 }}>
                      <img src={`data:image/jpeg;base64,${BRASAO_B64}`} alt="Brasão" style={{ width:64, height:64, objectFit:'contain', display:'block', margin:'0 auto 8px' }} />
                      {docUnidade.split('\n').map((l,i)=><div key={i} style={{ fontWeight:700, fontSize:i<2?'9.5pt':'9pt', letterSpacing:'0.04em' }}>{l}</div>)}
                      <div style={{ fontSize:'11pt', fontWeight:900, marginTop:6, letterSpacing:'0.07em' }}>{docTitle}</div>
                      {(docLocal||docData) && <div style={{ fontSize:'8.5pt', marginTop:3, fontStyle:'italic' }}>{docLocal}{docData?', '+new Date(docData+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):''}</div>}
                    </div>
                    <div style={{ fontSize:'8pt', color:'#888', fontStyle:'italic', textAlign:'center', marginBottom:8 }}>... dados da planilha aparecem aqui ...</div>
                    {docAssinante && <div style={{ marginTop:30, textAlign:'center' }}><div style={{ width:160, height:1, background:'#333', margin:'0 auto 5px' }} /><div style={{ fontWeight:700, fontSize:'8.5pt', textTransform:'uppercase', letterSpacing:'0.04em' }}>{docAssinante}</div><div style={{ fontSize:'8pt', fontStyle:'italic', color:'#555' }}>{docCargo}</div></div>}
                  </>
                ) : (
                  <div style={{ textAlign:'center', color:'#999', fontStyle:'italic', padding:30 }}>Cabeçalho desativado. Ative a opção acima para incluir o brasão.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW TAB ── */}
      {activeTab === 'preview' && (
        <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, justifyContent:'flex-end' }}>
            <button className="btn btn-g btn-sm" onClick={()=>window.print()}>🖨 Imprimir</button>
            <button className="btn btn-outline btn-sm" onClick={exportWord} disabled={exporting}>📄 Word</button>
            <button className="btn btn-primary btn-sm" onClick={exportExcel} disabled={exporting}>📊 Excel</button>
          </div>
          <div style={{ background:'white', borderRadius:4, padding:32, boxShadow:'0 4px 20px rgba(0,0,0,.15)', fontFamily:"'Times New Roman',serif", color:'#1a140a', maxWidth:800, margin:'0 auto' }}>
            {showHeader && (
              <div style={{ textAlign:'center', borderBottom:'2px solid #2a4020', paddingBottom:14, marginBottom:16 }}>
                <img src={`data:image/jpeg;base64,${BRASAO_B64}`} alt="Brasão" style={{ width:70, height:70, objectFit:'contain', display:'block', margin:'0 auto 8px' }} />
                {docUnidade.split('\n').map((l,i)=><div key={i} style={{ fontWeight:700, fontSize:i<2?'10pt':'9.5pt', letterSpacing:'0.04em' }}>{l}</div>)}
                <div style={{ fontSize:'12pt', fontWeight:900, marginTop:7, letterSpacing:'0.07em' }}>{docTitle}</div>
                {(docLocal||docData) && <div style={{ fontSize:'9pt', marginTop:3, fontStyle:'italic' }}>{docLocal}{docData?', '+new Date(docData+'T12:00:00').toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}):''}</div>}
              </div>
            )}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'9pt' }}>
              <colgroup>{grid[0].map((_,ci)=><col key={ci} style={{ width: Math.round(colWidths[ci]/96*2.54)+'cm' }} />)}</colgroup>
              {grid.filter(row=>row.some(c=>c.v!=='')).map((row,ri)=>(
                <tr key={ri}>
                  {row.map((c,ci)=>(
                    <td key={ci} style={{
                      padding:'3px 6px',
                      border: c.border ? '1px solid #999' : '1px solid #e0ddd0',
                      background: c.bgColor || 'transparent',
                      fontWeight: c.bold ? 700 : 'normal',
                      fontStyle: c.italic ? 'italic' : 'normal',
                      textAlign: c.align || 'left',
                      fontSize: (c.fontSize||11)+'pt',
                      color: c.textColor || '#1a140a',
                      whiteSpace: c.wrap ? 'normal' : 'nowrap',
                      overflow: 'hidden',
                    }}>
                      {c.v}
                    </td>
                  ))}
                </tr>
              ))}
            </table>
            {docAssinante && (
              <div style={{ marginTop:50, textAlign:'center' }}>
                <div style={{ width:200, height:1, background:'#333', margin:'0 auto 5px' }} />
                <div style={{ fontWeight:700, fontSize:'9pt', textTransform:'uppercase', letterSpacing:'0.04em' }}>{docAssinante}</div>
                <div style={{ fontStyle:'italic', fontSize:'8.5pt', color:'#555' }}>{docCargo}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TUTORIAL ── */}
      {showTutorial && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--accent)', borderRadius:8, padding:28, maxWidth:400, width:'100%', margin:20, boxShadow:'0 8px 40px rgba(0,0,0,.6),0 0 28px rgba(107,124,94,.3)' }}>
            {/* Progress dots */}
            <div style={{ display:'flex', gap:4, marginBottom:12 }}>
              {TUTORIAL_STEPS.map((_,i)=>(
                <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:i===tutStep?'var(--accent)':'var(--bg-dark)', border:'1px solid var(--border)', cursor:'pointer', transition:'background .2s' }} onClick={()=>setTutStep(i)} />
              ))}
            </div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'0.55rem', color:'var(--text-muted)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Passo {tutStep+1} de {TUTORIAL_STEPS.length}</div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'var(--accent)', marginBottom:10, fontWeight:700 }}>{TUTORIAL_STEPS[tutStep].title}</h3>
            <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.7, marginBottom:10 }}>{TUTORIAL_STEPS[tutStep].body}</p>
            {TUTORIAL_STEPS[tutStep].tip && (
              <div style={{ background:'rgba(107,124,94,.12)', border:'1px solid rgba(107,124,94,.3)', borderRadius:4, padding:'8px 12px', fontSize:'0.72rem', color:'var(--accent)', marginBottom:16 }}>
                💡 {TUTORIAL_STEPS[tutStep].tip}
              </div>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowTutorial(false)}>Pular</button>
              <div style={{ display:'flex', gap:6 }}>
                {tutStep > 0 && <button className="btn btn-g btn-sm" onClick={()=>setTutStep(t=>t-1)}>‹ Voltar</button>}
                <button className="btn btn-primary btn-sm" onClick={()=>tutStep===TUTORIAL_STEPS.length-1?setShowTutorial(false):setTutStep(t=>t+1)}>
                  {tutStep===TUTORIAL_STEPS.length-1?'✓ Concluir':'Próximo ›'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

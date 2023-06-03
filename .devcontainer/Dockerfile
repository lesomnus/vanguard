FROM ghcr.io/lesomnus/dev-node:18

RUN cd ~ \
	&& curl -o protoc.zip -L https://github.com/protocolbuffers/protobuf/releases/download/v3.20.1/protoc-3.20.1-linux-x86_64.zip \
	&& unzip protoc.zip bin/protoc -d /usr/local \
	&& chmod 755 /usr/local/bin/protoc \
	&& rm -f protoc.zip

RUN cd ~ \
	&& wget -O chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
	&& apt update \
	&& apt install ./chrome.deb --yes \
	&& apt-get clean --yes \
	&& rm -rf /var/lib/apt/lists/* \
	&& rm ./chrome.deb




USER hypnos

# Comment below lines if you don't want to use Zsh
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh || true \
	&& git clone https://github.com/zsh-users/zsh-autosuggestions         ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions     \
	&& git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
	&& git clone https://github.com/zsh-users/zsh-completions             ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions         \
	&& git clone https://github.com/supercrabtree/k                       ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/k
ADD .zshrc /home/hypnos
ENV SHELL /bin/zsh
